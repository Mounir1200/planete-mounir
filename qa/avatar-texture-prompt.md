# Avatar reference texture

Generated with the built-in imagegen tool on 27 October 2026. Inputs: the user-supplied Gemini portrait sheet and their existing `DABIRE_Mounir-mai_2026.jpg`. This is an AI-derived albedo reference, not a scan or a recovered Gemini mesh. The original inputs are unchanged.

Saved game asset: `public/models/mounir/face-albedo-v1.png`.

## Exact prompt

Use case: identity-preserve. Asset type: frontal base-color projection texture for a real Three.js sculpted game avatar, NOT an illustration of a 3D software interface.
Input image 1 is the user's preferred Gemini 3D portrait sheet. Use the CENTER FRONT PORTRAIT of that sheet as the likeness and realistic style reference. Input image 2 is the same person's actual photograph for accurate identity and skin tone.
Produce ONE square, straight-on orthographic head portrait from skull top through bottom of chin, ears included, no shoulders. Preserve his identity: broad softly squared jaw, full natural lips, broad nose with rounded alae, almond brown eyes, short tightly curled black hair, subtle thin moustache and chin stubble, deep warm brown skin. Neutral relaxed expression, lips closed, gaze directly ahead. Remove glasses completely because glasses will be separate 3D geometry. No smile, no caricature, no enlarged eyes, no beard added.
This image will become a front projection ALBEDO texture: even cross-polarized diffuse illumination, very little baked shading, no highlights, no directional shadows; preserve fine natural skin pores and color variation. Use a plain solid medium brown backdrop close to the skin color, not transparent. Perfectly straight, symmetric camera, no perspective tilt. Hair top at 5% image height, chin bottom at 95%; left/right cheek extremes about 21% and 79% image width; nose centered at 50% width; ears entirely visible. Detailed photorealistic neutral game character head. No text, UI, grids, wireframes, clothing, jewelry, border, multiple views, or surrounding objects.

