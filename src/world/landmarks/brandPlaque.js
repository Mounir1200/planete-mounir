import { MeshBasicMaterial, PlaneGeometry } from 'three';

// The original artwork is mapped without distortion or recolouring. An unlit,
// white plaque keeps official logo colours legible in the day/night cycle.
export function brandPlaque(kit, brand, loadTexture, { width, height, ...position }) {
  const panel = kit.group(position);
  kit.box(width, height, 0.08, new MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), {
    parent: panel, y: -height / 2, shadow: false,
  });
  if (!loadTexture) return panel;
  const scale = Math.min((width - 0.2) / brand.width, (height - 0.16) / brand.height);
  const texture = loadTexture(brand.logo);
  kit.mesh(new PlaneGeometry(brand.width * scale, brand.height * scale), new MeshBasicMaterial({
    map: texture, transparent: true, toneMapped: false, depthWrite: false,
  }), { parent: panel, z: 0.045, shadow: false });
  return panel;
}
