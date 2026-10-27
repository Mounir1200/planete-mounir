//! The actual per-frame player simulation for Planète Mounir.
//!
//! Three.js supplies terrain and mesh collision queries between `player_steer`
//! and `player_resolve`. This crate owns position, tangent velocity, facing,
//! acceleration, gravity, double jumps, shore response and footstep events.
//! The small C ABI needs no generated bindings or third-party dependencies.

const STEP: u32 = 1;
const SPLASH: u32 = 2;
const JUMP: u32 = 4;
const DOUBLE_JUMP: u32 = 8;
const LAND: u32 = 16;
const DEEP_WATER: u32 = 32;
pub const STATE_LEN: usize = 27;

#[derive(Clone, Copy, Debug, Default)]
struct Vec3(f64, f64, f64);

impl Vec3 {
    fn add(self, other: Self) -> Self {
        Self(self.0 + other.0, self.1 + other.1, self.2 + other.2)
    }
    fn sub(self, other: Self) -> Self {
        self.add(other.scale(-1.0))
    }
    fn scale(self, amount: f64) -> Self {
        Self(self.0 * amount, self.1 * amount, self.2 * amount)
    }
    fn dot(self, other: Self) -> f64 {
        self.0 * other.0 + self.1 * other.1 + self.2 * other.2
    }
    fn cross(self, other: Self) -> Self {
        Self(
            self.1 * other.2 - self.2 * other.1,
            self.2 * other.0 - self.0 * other.2,
            self.0 * other.1 - self.1 * other.0,
        )
    }
    fn length(self) -> f64 {
        self.dot(self).sqrt()
    }
    fn normalized(self) -> Self {
        let length = self.length();
        if length > 1e-12 {
            self.scale(1.0 / length)
        } else {
            Self::default()
        }
    }
    fn tangent(self, up: Self) -> Self {
        self.sub(up.scale(self.dot(up)))
    }
    fn rotate(self, axis: Self, angle: f64) -> Self {
        self.scale(angle.cos())
            .add(axis.cross(self).scale(angle.sin()))
            .add(axis.scale(axis.dot(self) * (1.0 - angle.cos())))
    }
    fn write(self, out: &mut [f64]) {
        out[..3].copy_from_slice(&[self.0, self.1, self.2]);
    }
}

fn any_tangent(up: Vec3) -> Vec3 {
    let reference = if up.1.abs() < 0.95 {
        Vec3(0.0, 1.0, 0.0)
    } else {
        Vec3(0.0, 0.0, 1.0)
    };
    reference.tangent(up).normalized()
}

#[derive(Clone, Copy)]
struct Config {
    walk_speed: f64,
    run_speed: f64,
    wading_factor: f64,
    ground_response: f64,
    air_response: f64,
    turn_response: f64,
    jump_speed: f64,
    gravity: f64,
    max_jumps: u32,
    snap_distance: f64,
}

pub struct Player {
    config: Config,
    position: Vec3,
    up: Vec3,
    facing: Vec3,
    velocity: Vec3,
    candidate: Vec3,
    vertical_speed: f64,
    grounded: bool,
    jumps_used: u32,
    wading: bool,
    distance_since_step: f64,
    impact: f64,
    landed: bool,
    events: u32,
    event_position: Vec3,
    output: [f64; STATE_LEN],
}

impl Player {
    fn new(config: Config) -> Self {
        let mut player = Self {
            config,
            position: Vec3(0.0, 36.0, 0.0),
            up: Vec3(0.0, 1.0, 0.0),
            facing: Vec3(0.0, 0.0, 1.0),
            velocity: Vec3::default(),
            candidate: Vec3::default(),
            vertical_speed: 0.0,
            grounded: true,
            jumps_used: 0,
            wading: false,
            distance_since_step: 0.0,
            impact: 0.0,
            landed: false,
            events: 0,
            event_position: Vec3::default(),
            output: [0.0; STATE_LEN],
        };
        player.sync_output();
        player
    }

    fn place(&mut self, position: Vec3, facing_target: Option<Vec3>, ground: f64) {
        self.up = position.normalized();
        self.position = self.up.scale(ground);
        let facing = facing_target.map_or(self.facing, |target| target.sub(position));
        self.facing = facing.tangent(self.up).normalized();
        if self.facing.length() < 1e-6 {
            self.facing = any_tangent(self.up);
        }
        self.velocity = Vec3::default();
        self.vertical_speed = 0.0;
        self.grounded = true;
        self.jumps_used = 0;
        self.wading = false;
        self.distance_since_step = 0.0;
        self.impact = 0.0;
        self.events = 0;
        self.landed = false;
        self.candidate = self.position;
        self.event_position = self.position;
        self.sync_output();
    }

    fn steer(&mut self, dt: f64, x: f64, y: f64, run: bool, camera: Vec3) {
        self.events = 0;
        self.landed = false;
        self.impact = 0.0;
        self.up = self.position.normalized();
        let mut forward = camera.tangent(self.up);
        if forward.dot(forward) < 1e-6 {
            forward = self.facing;
        }
        forward = forward.normalized();
        let right = forward.cross(self.up).normalized();
        let mut wish = forward.scale(y).add(right.scale(x));
        let amount = wish.length().min(1.0);
        if amount > 0.05 {
            wish = wish.normalized();
            let angle = self.facing.dot(wish).clamp(-1.0, 1.0).acos();
            if angle < 1e-4 {
                self.facing = wish;
            } else {
                let cross = self.facing.cross(wish).dot(self.up);
                let sign = if cross < 0.0 { -1.0 } else { 1.0 };
                self.facing = self
                    .facing
                    .rotate(self.up, sign * angle.min(self.config.turn_response * dt))
                    .normalized();
            }
        }
        let top_speed = if run {
            self.config.run_speed
        } else {
            self.config.walk_speed
        } * if self.wading {
            self.config.wading_factor
        } else {
            1.0
        };
        let target = wish.scale(amount * top_speed);
        let response = if self.grounded {
            self.config.ground_response
        } else {
            self.config.air_response
        };
        let damping = 1.0 - (-response * dt).exp();
        self.velocity = self.velocity.tangent(self.up);
        self.velocity = self.velocity.add(target.sub(self.velocity).scale(damping));
        self.candidate = self.position.add(self.velocity.scale(dt));
        self.sync_output();
    }

    fn resolve(
        &mut self,
        dt: f64,
        candidate: Vec3,
        ground: f64,
        blocked_water: bool,
        wading: bool,
        jump: bool,
    ) {
        if blocked_water {
            self.velocity = self.velocity.scale(-0.2);
            self.events |= DEEP_WATER;
        } else {
            self.wading = wading;
            let travelled = self.position.sub(candidate).length();
            self.position = candidate;
            if self.grounded {
                self.distance_since_step += travelled;
                let step_length = if self.velocity.length() > self.config.walk_speed + 0.5 {
                    1.5
                } else {
                    1.1
                };
                if self.distance_since_step > step_length {
                    self.distance_since_step = 0.0;
                    self.events |= if self.wading { SPLASH } else { STEP };
                }
            }
        }
        self.event_position = self.position;
        self.up = self.position.normalized();
        let mut radius = self.position.length();
        if jump && (self.grounded || self.jumps_used < self.config.max_jumps) {
            self.vertical_speed = self.config.jump_speed * if self.grounded { 1.0 } else { 0.9 };
            self.jumps_used = if self.grounded {
                1
            } else {
                self.jumps_used + 1
            };
            self.events |= if self.grounded { JUMP } else { DOUBLE_JUMP };
            self.grounded = false;
        }
        if self.grounded {
            if radius - ground > self.config.snap_distance {
                self.grounded = false;
                self.jumps_used = 1;
            } else {
                radius = ground;
            }
        }
        if !self.grounded {
            self.vertical_speed -= self.config.gravity * dt;
            radius += self.vertical_speed * dt;
            if radius <= ground {
                self.impact = -self.vertical_speed;
                self.landed = true;
                radius = ground;
                self.grounded = true;
                self.jumps_used = 0;
                self.vertical_speed = 0.0;
                if self.impact > 6.0 {
                    self.events |= LAND;
                }
            }
        }
        self.position = self.up.scale(radius);
        self.facing = self.facing.tangent(self.up).normalized();
        if self.facing.length() < 1e-6 {
            self.facing = any_tangent(self.up);
        }
        self.sync_output();
    }

    fn sync_output(&mut self) {
        self.position.write(&mut self.output[0..3]);
        self.up.write(&mut self.output[3..6]);
        self.facing.write(&mut self.output[6..9]);
        self.velocity.write(&mut self.output[9..12]);
        self.output[12] = self.vertical_speed;
        self.output[13] = self.grounded as u8 as f64;
        self.output[14] = self.jumps_used as f64;
        self.output[15] = self.wading as u8 as f64;
        self.output[16] = self.distance_since_step;
        self.candidate.write(&mut self.output[17..20]);
        self.output[20] = self.impact;
        self.output[21] = self.events as f64;
        self.output[22] = self.velocity.length();
        self.output[23] = self.landed as u8 as f64;
        self.event_position.write(&mut self.output[24..27]);
    }
}

// Pointers are opaque handles owned by Rust. The JavaScript bridge never writes
// state memory, and only passes handles returned by player_create.
#[no_mangle]
pub extern "C" fn core_abi_version() -> u32 {
    1
}

#[no_mangle]
pub extern "C" fn player_state_len() -> usize {
    STATE_LEN
}

#[no_mangle]
pub extern "C" fn player_create(
    walk_speed: f64,
    run_speed: f64,
    wading_factor: f64,
    ground_response: f64,
    air_response: f64,
    turn_response: f64,
    jump_speed: f64,
    gravity: f64,
    max_jumps: u32,
    snap_distance: f64,
) -> *mut Player {
    Box::into_raw(Box::new(Player::new(Config {
        walk_speed,
        run_speed,
        wading_factor,
        ground_response,
        air_response,
        turn_response,
        jump_speed,
        gravity,
        max_jumps,
        snap_distance,
    })))
}

#[no_mangle]
pub unsafe extern "C" fn player_destroy(handle: *mut Player) {
    if !handle.is_null() {
        drop(Box::from_raw(handle));
    }
}

#[no_mangle]
pub unsafe extern "C" fn player_state_ptr(handle: *const Player) -> *const f64 {
    (*handle).output.as_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn player_place(
    handle: *mut Player,
    px: f64,
    py: f64,
    pz: f64,
    tx: f64,
    ty: f64,
    tz: f64,
    has_target: u32,
    ground: f64,
) {
    let target = if has_target != 0 {
        Some(Vec3(tx, ty, tz))
    } else {
        None
    };
    (*handle).place(Vec3(px, py, pz), target, ground);
}

#[no_mangle]
pub unsafe extern "C" fn player_steer(
    handle: *mut Player,
    dt: f64,
    x: f64,
    y: f64,
    run: u32,
    camera_x: f64,
    camera_y: f64,
    camera_z: f64,
) {
    (*handle).steer(
        dt.clamp(0.0, 0.05),
        x,
        y,
        run != 0,
        Vec3(camera_x, camera_y, camera_z),
    );
}

#[no_mangle]
pub unsafe extern "C" fn player_resolve(
    handle: *mut Player,
    dt: f64,
    x: f64,
    y: f64,
    z: f64,
    ground: f64,
    blocked_water: u32,
    wading: u32,
    jump: u32,
) {
    (*handle).resolve(
        dt.clamp(0.0, 0.05),
        Vec3(x, y, z),
        ground,
        blocked_water != 0,
        wading != 0,
        jump != 0,
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f64::consts::PI;
    fn player() -> Player {
        let config = Config {
            walk_speed: 6.2,
            run_speed: 11.0,
            wading_factor: 0.55,
            ground_response: 12.0,
            air_response: 3.0,
            turn_response: 14.0,
            jump_speed: 8.6,
            gravity: 26.0,
            max_jumps: 2,
            snap_distance: 0.45,
        };
        let mut player = Player::new(config);
        player.place(Vec3(0.0, 35.0, 0.0), Some(Vec3(0.0, 35.0, 1.0)), 35.0);
        player
    }
    fn frame(player: &mut Player, dt: f64, x: f64, y: f64, run: bool, jump: bool) {
        let camera = player.facing;
        player.steer(dt, x, y, run, camera);
        player.resolve(dt, player.candidate, 35.0, false, false, jump);
    }

    #[test]
    fn walking_circles_a_planet_without_radial_drift() {
        let mut p = player();
        for _ in 0..2400 {
            frame(&mut p, 1.0 / 60.0, 0.0, 1.0, false, false);
        }
        assert!((p.position.length() - 35.0).abs() < 1e-9);
        assert!(p.up.dot(p.facing).abs() < 1e-9);
        assert!((p.velocity.length() - 6.2).abs() < 0.02);
        assert!(p.position.sub(Vec3(0.0, 35.0, 0.0)).length() > 1.0);
    }

    #[test]
    fn running_and_diagonal_input_have_the_same_speed_cap() {
        let mut straight = player();
        let mut diagonal = player();
        for _ in 0..120 {
            for (p, x) in [(&mut straight, 0.0), (&mut diagonal, 1.0)] {
                p.steer(1.0 / 60.0, x, 1.0, true, Vec3(0.0, 0.0, 1.0));
                p.resolve(1.0 / 60.0, p.candidate, 35.0, false, false, false);
            }
        }
        assert!((straight.velocity.length() - diagonal.velocity.length()).abs() < 0.02);
        assert!(straight.velocity.length() > 10.9 && straight.velocity.length() <= 11.0);
    }

    #[test]
    fn double_jump_rejects_third_jump_and_landing_resets_it() {
        let mut p = player();
        frame(&mut p, 1.0 / 60.0, 0.0, 0.0, false, true);
        assert_eq!(p.events & JUMP, JUMP);
        assert_eq!(p.jumps_used, 1);
        frame(&mut p, 1.0 / 60.0, 0.0, 0.0, false, true);
        assert_eq!(p.events & DOUBLE_JUMP, DOUBLE_JUMP);
        let speed = p.vertical_speed;
        frame(&mut p, 1.0 / 60.0, 0.0, 0.0, false, true);
        assert_eq!(p.events & (JUMP | DOUBLE_JUMP), 0);
        assert!(p.vertical_speed < speed);
        let mut landed = false;
        for _ in 0..180 {
            frame(&mut p, 1.0 / 60.0, 0.0, 0.0, false, false);
            landed |= p.landed;
        }
        assert!(landed && p.grounded);
        assert_eq!(p.jumps_used, 0);
        assert_eq!(p.vertical_speed, 0.0);
    }

    #[test]
    fn deep_water_blocks_position_and_returns_feedback() {
        let mut p = player();
        let start = p.position;
        p.steer(1.0 / 60.0, 0.0, 1.0, true, Vec3(0.0, 0.0, 1.0));
        let forward_velocity = p.velocity;
        p.resolve(1.0 / 60.0, p.candidate, 35.0, true, false, false);
        assert!(p.position.sub(start).length() < 1e-9);
        assert!(p.velocity.dot(forward_velocity) < 0.0);
        assert_eq!(p.events & DEEP_WATER, DEEP_WATER);
    }

    #[test]
    fn wading_slows_movement_and_steps_produce_splash_events() {
        let mut p = player();
        let mut splashed = false;
        for _ in 0..180 {
            p.steer(1.0 / 60.0, 0.0, 1.0, false, any_tangent(p.up));
            p.resolve(1.0 / 60.0, p.candidate, 35.0, false, true, false);
            splashed |= p.events & SPLASH != 0;
        }
        assert!(splashed);
        assert!((p.velocity.length() - 6.2 * 0.55).abs() < 0.02);
    }

    #[test]
    fn stepping_off_a_ledge_uses_gravity_and_one_remaining_jump() {
        let mut p = player();
        p.steer(1.0 / 60.0, 0.0, 0.0, false, Vec3(0.0, 0.0, 1.0));
        p.resolve(1.0 / 60.0, p.candidate, 31.0, false, false, false);
        assert!(!p.grounded && p.vertical_speed < 0.0);
        assert_eq!(p.jumps_used, 1);
    }

    #[test]
    fn teleport_resets_motion_and_keeps_a_valid_tangent_at_either_pole() {
        let mut p = player();
        frame(&mut p, 1.0 / 60.0, 0.0, 1.0, true, true);
        p.place(Vec3(0.0, -35.0, 0.0), Some(Vec3(0.0, -70.0, 0.0)), 35.0);
        assert_eq!(p.jumps_used, 0);
        assert_eq!(p.velocity.length(), 0.0);
        assert_eq!(p.vertical_speed, 0.0);
        assert!((p.facing.length() - 1.0).abs() < 1e-9);
        assert!(p.up.dot(p.facing).abs() < 1e-9);
    }

    #[test]
    fn walking_is_stable_across_common_frame_rates() {
        let mut slow = player();
        let mut fast = player();
        for _ in 0..120 {
            frame(&mut slow, 1.0 / 30.0, 0.0, 1.0, false, false);
        }
        for _ in 0..480 {
            frame(&mut fast, 1.0 / 120.0, 0.0, 1.0, false, false);
        }
        assert!(slow.position.sub(fast.position).length() < 0.12);
        assert!(slow.up.dot(fast.up).clamp(-1.0, 1.0).acos() < PI / 180.0);
    }
}
