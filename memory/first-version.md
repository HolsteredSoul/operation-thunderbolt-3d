---

name: first-version

description: Scope, asset provenance, balance and stopping boundary for the completed first version

metadata:

  type: project

---

The user requested one finished, verified playable survival mode and then a stop for review. They explicitly requested Blender MCP during implementation. Soldiers and cover are authored through Blender MCP and loaded from assets/village-pack.json; the editable workshop and original cottage checkpoint are retained. Numerical combat balance comes from the current source modules; adaptation differences and evidence live in BALANCE.md and VERIFICATION.md.



**How to apply:** Ask what the user wants changed before starting another pass. Preserve the original project and do not add modes or progression. Use Blender MCP, with small saved steps and no GPU rendering.


The user requested stronger unit differentiation on review. The follow-up uses distinct silhouettes (pistol officer, kneeling hooded sniper, broad MG emplacement), contrasting uniforms and aim-triggered role labels. Combat values remain unchanged. Stop again for review after this focused pass.

A second readability review showed that model differences and labels available only on aim were insufficient. Persistent role names plus distinct badge symbols now identify enemies during combat; YOU and a mint ground ring distinguish the player. Preserve these identification aids unless the user asks otherwise.


On 6 September the user approved the gameplay refinement plan and ammo review: 16-round emergency threshold, 24-round recovery, 30-second ordinary ammo lifetime, brighter bullets, slight aiming refinement and Xbox support. Enemy pressure must stay unchanged because the game is already challenging. The user subsequently rejected the stretched sniper pose specifically; it is now a compact kneeling Blender model. Other artwork remains approved.

Physical Xbox testing failed in both reported browsers despite passing simulated mapping tests. Chrome exposed an empty controller list, and native XInput reported no connected device. A USB test response is pending. Never substitute simulated-controller success for a verified hardware connection; consult CONTROLLER-NOTES.md and finish this diagnosis before claiming controller completion.
