"""Build, animate, render and export the TBM V5 armillary asset.

Run from the repository root:
  & "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" --background --python blender/scripts/build_tbm_armillary.py
  & "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" --background blender/tbm-armillary-master.blend --python blender/scripts/build_tbm_armillary.py -- --render
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
CONTRACT = json.loads((ROOT / "blender/config/tbm-scene-contract.json").read_text(encoding="utf-8"))
BLEND_PATH = ROOT / "blender/tbm-armillary-master.blend"
GLB_PATH = ROOT / CONTRACT["web"]["glb"]
REVEAL_ROOT = ROOT / CONTRACT["web"]["revealRoot"]
RENDER_ONLY = "--render" in sys.argv


def rgba(hex_value: str, alpha: float = 1.0):
    value = hex_value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) / 255 for index in (0, 2, 4)) + (alpha,)


PALETTE = CONTRACT["palette"]


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)


def collection(name: str):
    item = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(item)
    return item


def move_to_collection(item, target):
    for existing in list(item.users_collection):
        existing.objects.unlink(item)
    target.objects.link(item)


def material(name: str, colour: str, metallic: float, roughness: float, emission: float = 0.0):
    item = bpy.data.materials.new(name)
    item.use_nodes = True
    principled = item.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = rgba(colour)
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    if emission:
        principled.inputs["Emission Color"].default_value = rgba(colour)
        principled.inputs["Emission Strength"].default_value = emission
    return item


def smooth(item):
    if item.type == "MESH":
        for polygon in item.data.polygons:
            polygon.use_smooth = True


def add_uv_sphere(name, radius, location, mat, target):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=radius, location=location)
    item = bpy.context.object
    item.name = name
    smooth(item)
    item.data.materials.append(mat)
    move_to_collection(item, target)
    return item


def add_torus(name, major, minor, rotation, mat, target):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major,
        minor_radius=minor,
        major_segments=96,
        minor_segments=12,
        location=(0, 0, 0),
        rotation=rotation,
    )
    item = bpy.context.object
    item.name = name
    smooth(item)
    item.data.materials.append(mat)
    move_to_collection(item, target)
    return item


def animate_scale(item, start, settle, scale=1.0):
    item.scale = (0.001, 0.001, 0.001)
    item.keyframe_insert(data_path="scale", frame=start)
    item.scale = (scale, scale, scale)
    item.keyframe_insert(data_path="scale", frame=settle)


def add_node(name, angle, radius, elevation, mat, target, start):
    x = math.cos(angle) * radius
    y = math.sin(angle) * radius
    z = elevation
    node = add_uv_sphere(name, 0.075, (x, y, z), mat, target)
    animate_scale(node, start, start + 14, 1)
    return node


def build_scene():
    reset_scene()
    scene = bpy.context.scene
    scene.frame_start = CONTRACT["frameStart"]
    scene.frame_end = CONTRACT["frameEnd"]
    # Blender 5.2 exposes the Eevee Next renderer through the stable enum name.
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x, scene.render.resolution_y = CONTRACT["render"]["desktop"]
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.quality = 90
    scene.render.film_transparent = False
    scene.render.fps = CONTRACT["fps"]
    scene.world.color = rgba(PALETTE["void"])[:3]
    scene.view_settings.look = "AgX - Medium High Contrast"

    master = collection("TBM_MASTER")
    render_only = collection("TBM_RENDER_ONLY")
    camera_collection = collection("TBM_CAMERA_LIGHTS")
    bronze = material("TBM_Bronze", PALETTE["bronze"], 0.92, 0.24)
    bronze_hot = material("TBM_Bronze_Hot", PALETTE["bronzeHighlight"], 0.88, 0.18)
    iron = material("TBM_Black_Iron", PALETTE["iron"], 0.84, 0.2)
    ember = material("TBM_Ember", PALETTE["ember"], 0.1, 0.32, 4.5)

    core = add_uv_sphere("TBM_Core", 1.35, (0, 0, 0), iron, master)
    core.scale = (0.72, 0.72, 0.72)
    animate_scale(core, 1, 36, 0.72)
    core.rotation_euler = (0.12, -0.18, 0)
    core.keyframe_insert(data_path="rotation_euler", frame=1)
    core.rotation_euler = (0.2, 0.32, 0.38)
    core.keyframe_insert(data_path="rotation_euler", frame=156)

    cage = []
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.92)
    shell = bpy.context.object
    shell.name = "TBM_Network_Shell"
    shell.data.materials.append(bronze_hot)
    move_to_collection(shell, master)
    wire = shell.modifiers.new("TBM_Network_Wire", "WIREFRAME")
    wire.thickness = 0.009
    wire.use_replace = True
    animate_scale(shell, 45, 84, 1)
    cage.append(shell)

    rings = []
    ring_specs = [
        ("TBM_Ring_Orbital_A", 2.62, 0.035, (math.radians(66), math.radians(10), math.radians(-22)), 18, 74),
        ("TBM_Ring_Orbital_B", 2.35, 0.045, (math.radians(22), math.radians(71), math.radians(30)), 31, 88),
        ("TBM_Ring_Orbital_C", 2.04, 0.03, (math.radians(112), math.radians(18), math.radians(-40)), 42, 104),
        ("TBM_Ring_Orbital_D", 2.78, 0.024, (math.radians(46), math.radians(-41), math.radians(66)), 58, 120),
    ]
    for name, major, minor, rotation, start, settle in ring_specs:
        ring = add_torus(name, major, minor, rotation, bronze, master)
        animate_scale(ring, start, settle, 1)
        ring.rotation_euler = rotation
        ring.keyframe_insert(data_path="rotation_euler", frame=settle)
        ring.rotation_euler = tuple(value + offset for value, offset in zip(rotation, (0.35, -0.48, 0.6)))
        ring.keyframe_insert(data_path="rotation_euler", frame=156)
        rings.append(ring)

    for index in range(20):
        angle = index * math.tau / 20
        add_node(f"TBM_Node_{index:02d}", angle, 1.91, math.sin(index * 1.7) * 0.72, bronze_hot, master, 58 + (index % 6) * 5)

    for index in range(28):
        angle = index * math.tau / 28 + 0.18
        radius = 3.3 + (index % 4) * 0.14
        spark = add_uv_sphere(f"TBM_Ember_{index:02d}", 0.018 + (index % 3) * 0.008, (math.cos(angle) * radius, math.sin(angle) * radius, -1.4 + (index % 7) * 0.42), ember, render_only)
        spark.hide_render = False
        animate_scale(spark, 82 + (index % 11), 94 + (index % 11), 1)
        spark.location = (math.cos(angle) * radius, math.sin(angle) * radius, -1.4 + (index % 7) * 0.42)
        spark.keyframe_insert(data_path="location", frame=94 + (index % 11))
        spark.location = (math.cos(angle + .45) * (radius + 1.8), math.sin(angle + .45) * (radius + 1.8), 0.2 + (index % 5) * .5)
        spark.keyframe_insert(data_path="location", frame=156)

    # A dark backdrop plane makes reflected bronze and drifting embers legible in the rendered reveal.
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 3.9, 0), rotation=(math.radians(90), 0, 0))
    backdrop = bpy.context.object
    backdrop.name = "TBM_Backdrop"
    backdrop.data.materials.append(material("TBM_Backdrop_Material", "#071111", 0.0, 1.0))
    move_to_collection(backdrop, render_only)

    bpy.ops.object.camera_add(location=(0, -9.1, 1.0))
    camera = bpy.context.object
    camera.name = "TBM_Reveal_Camera"
    camera.data.lens = 52
    camera.data.sensor_width = 36
    move_to_collection(camera, camera_collection)
    scene.camera = camera
    camera.location = (0.15, -10.2, 1.18)
    camera.keyframe_insert(data_path="location", frame=1)
    camera.location = (0.4, -8.45, 0.7)
    camera.keyframe_insert(data_path="location", frame=104)
    camera.location = (0.55, -8.8, 0.55)
    camera.keyframe_insert(data_path="location", frame=156)

    target = bpy.data.objects.new("TBM_Camera_Target", None)
    camera_collection.objects.link(target)
    target.location = (0, 0, 0)
    track = camera.constraints.new(type="TRACK_TO")
    track.target = target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"

    def add_area(name, location, energy, colour, size):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.data.color = rgba(colour)[:3]
        move_to_collection(light, camera_collection)
        light.constraints.new(type="TRACK_TO").target = target
        light.constraints[-1].track_axis = "TRACK_NEGATIVE_Z"
        light.constraints[-1].up_axis = "UP_Y"
        return light

    add_area("TBM_Key_Light", (-4.5, -4.0, 5.5), 900, PALETTE["bronzeHighlight"], 5.0)
    add_area("TBM_Rim_Light", (4.0, 1.2, 3.2), 760, PALETTE["bronze"], 4.0)
    add_area("TBM_Cool_Fill", (-3.2, 2.5, -1.2), 380, PALETTE["mist"], 3.5)
    bpy.ops.object.light_add(type="POINT", location=(0, -1.5, -2.4))
    point = bpy.context.object
    point.name = "TBM_Ember_Light"
    point.data.energy = 190
    point.data.color = rgba(PALETTE["ember"])[:3]
    move_to_collection(point, camera_collection)

    # Keep the authored keyframes within the blend file, but export a settled model for the web hero.
    scene.frame_set(156)
    bpy.ops.object.select_all(action="DESELECT")
    for item in master.objects:
        item.select_set(True)
    bpy.context.view_layer.objects.active = core
    GLB_PATH.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    bpy.ops.export_scene.gltf(filepath=str(GLB_PATH), export_format="GLB", use_selection=True, export_apply=True, export_animations=False, export_materials="EXPORT")
    return scene


def render_reveal(scene):
    desktop_dir = REVEAL_ROOT / "desktop"
    mobile_dir = REVEAL_ROOT / "mobile"
    desktop_dir.mkdir(parents=True, exist_ok=True)
    mobile_dir.mkdir(parents=True, exist_ok=True)
    count = CONTRACT["render"]["revealSamples"]
    frames = []
    for index in range(count):
        timeline_frame = round(1 + index * (CONTRACT["frameEnd"] - 1) / (count - 1))
        scene.frame_set(timeline_frame)
        filename = f"frame_{index + 1:04d}.webp"
        scene.render.resolution_x, scene.render.resolution_y = CONTRACT["render"]["desktop"]
        scene.render.filepath = str(desktop_dir / filename)
        bpy.ops.render.render(write_still=True)
        scene.render.resolution_x, scene.render.resolution_y = CONTRACT["render"]["mobile"]
        scene.render.filepath = str(mobile_dir / filename)
        bpy.ops.render.render(write_still=True)
        frames.append({"desktop": f"assets/forge-reveal-v5/desktop/{filename}", "mobile": f"assets/forge-reveal-v5/mobile/{filename}"})
    manifest = {"version": 5, "selection": {"sampleCount": count}, "frames": frames}
    (REVEAL_ROOT / "frame-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


if __name__ == "__main__":
    scene = build_scene()
    if RENDER_ONLY:
        render_reveal(scene)
