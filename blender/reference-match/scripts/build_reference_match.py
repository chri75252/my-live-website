"""Build and render the reference-match cinematic V6 scene in Blender 5.2.

Usage from repository root:
  & "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" --background --python blender/reference-match/scripts/build_reference_match.py -- --render keyframes
  & "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" --background --python blender/reference-match/scripts/build_reference_match.py -- --render reveal
  & "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" --background --python blender/reference-match/scripts/build_reference_match.py -- --render cards

The script deliberately renders Cycles masters. The browser consumes the resulting
images; it does not attempt to re-create volumes, glare, sparks, and surface detail
with a simplistic GLB.
"""

from __future__ import annotations

import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[3]
CONTRACT = json.loads((ROOT / "blender/reference-match/config/scene-contract.json").read_text(encoding="utf-8"))
PALETTE = CONTRACT["palette"]
MODE = "keyframes"
KEYFRAME_ONLY = None
if "--" in sys.argv:
    arguments = sys.argv[sys.argv.index("--") + 1:]
    if "--render" in arguments:
        MODE = arguments[arguments.index("--render") + 1]
    if "--keyframe" in arguments:
        KEYFRAME_ONLY = arguments[arguments.index("--keyframe") + 1]


def colour(value: str, alpha: float = 1.0):
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) / 255 for index in (0, 2, 4)) + (alpha,)


def directory(relative: str) -> Path:
    result = ROOT / relative
    result.mkdir(parents=True, exist_ok=True)
    return result


def clean_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for item in list(bpy.data.collections):
        bpy.data.collections.remove(item)
    for item in list(bpy.data.materials):
        bpy.data.materials.remove(item)


def make_collection(name: str):
    result = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(result)
    return result


def move_to(item, target):
    for previous in list(item.users_collection):
        previous.objects.unlink(item)
    target.objects.link(item)


def set_smooth(item):
    if item.type == "MESH":
        for polygon in item.data.polygons:
            polygon.use_smooth = True


def node_input(node, name):
    return node.inputs.get(name) or node.inputs.get({"Metallic": "Metallic IOR Level"}.get(name, name))


def metal_material(name: str, base: str, roughness: float, *, bright: bool = False, black: bool = False):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    node_input(bsdf, "Base Color").default_value = colour(base)
    node_input(bsdf, "Metallic").default_value = 0.96 if not black else 0.67
    node_input(bsdf, "Roughness").default_value = roughness
    if black:
        clearcoat = node_input(bsdf, "Coat Weight") or node_input(bsdf, "Clearcoat")
        if clearcoat:
            clearcoat.default_value = 0.16
        coat_rough = node_input(bsdf, "Coat Roughness") or node_input(bsdf, "Clearcoat Roughness")
        if coat_rough:
            coat_rough.default_value = 0.22
    texture = nodes.new("ShaderNodeTexNoise")
    texture.inputs["Scale"].default_value = 14.0 if black else 7.0
    texture.inputs["Detail"].default_value = 6.0
    texture.inputs["Roughness"].default_value = 0.72
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.28
    ramp.color_ramp.elements[1].position = 0.72
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.15 if black else 0.28
    bump.inputs["Distance"].default_value = 0.09 if black else 0.14
    rough_map = nodes.new("ShaderNodeMapRange")
    rough_map.inputs["From Min"].default_value = 0.12
    rough_map.inputs["From Max"].default_value = 0.9
    rough_map.inputs["To Min"].default_value = max(0.05, roughness - 0.11)
    rough_map.inputs["To Max"].default_value = min(0.62, roughness + 0.18)
    links.new(texture.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], node_input(bsdf, "Normal"))
    links.new(texture.outputs["Fac"], rough_map.inputs["Value"])
    links.new(rough_map.outputs["Result"], node_input(bsdf, "Roughness"))
    if bright:
        emission = node_input(bsdf, "Emission Color")
        strength = node_input(bsdf, "Emission Strength")
        if emission and strength:
            emission.default_value = colour("#3d1004")
            strength.default_value = 0.08
    return material


def emissive_material(name: str, core: str, strength: float):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    output = nodes.get("Material Output")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = colour(core)
    emission.inputs["Strength"].default_value = strength
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    return material


def ground_material():
    material = bpy.data.materials.new("M_Ground_Engraved_Iron")
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    node_input(bsdf, "Base Color").default_value = colour("#090a09")
    node_input(bsdf, "Metallic").default_value = 0.78
    node_input(bsdf, "Roughness").default_value = 0.28
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.0
    noise.inputs["Detail"].default_value = 7.0
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.34
    bump.inputs["Distance"].default_value = 0.16
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], node_input(bsdf, "Normal"))
    return material


def add_uv_sphere(name, radius, location, material, target, segments=64):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=max(16, segments // 2), radius=radius, location=location)
    result = bpy.context.object
    result.name = name
    result.data.materials.append(material)
    set_smooth(result)
    move_to(result, target)
    return result


def add_torus(name, major, minor, rotation, material, target):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=128, minor_segments=20, rotation=rotation)
    result = bpy.context.object
    result.name = name
    result.data.materials.append(material)
    set_smooth(result)
    move_to(result, target)
    return result


def add_band(name, major, width, thickness, start, end, rotation, material, target):
    """A beveled, open rectangular forged band rather than a tubular torus."""
    steps = 144
    vertices, faces = [], []
    for index in range(steps):
        ratio = index / (steps - 1)
        angle = start + (end - start) * ratio
        radial = Vector((math.cos(angle), math.sin(angle), 0))
        centre = radial * major
        for radial_offset, z_offset in ((-width / 2, -thickness / 2), (width / 2, -thickness / 2), (width / 2, thickness / 2), (-width / 2, thickness / 2)):
            point = centre + radial * radial_offset + Vector((0, 0, z_offset))
            vertices.append(tuple(point))
    for index in range(steps - 1):
        base, nxt = index * 4, (index + 1) * 4
        faces.extend(((base, nxt, nxt + 1, base + 1), (base + 1, nxt + 1, nxt + 2, base + 2), (base + 2, nxt + 2, nxt + 3, base + 3), (base + 3, nxt + 3, nxt, base)))
    faces.extend(((0, 1, 2, 3), ((steps - 1) * 4, (steps - 1) * 4 + 3, (steps - 1) * 4 + 2, (steps - 1) * 4 + 1)))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    result = bpy.data.objects.new(name, mesh)
    target.objects.link(result)
    result.rotation_euler = rotation
    bevel = result.modifiers.new("Forged_Edge_Bevel", "BEVEL")
    bevel.width = 0.055
    bevel.segments = 3
    bevel.limit_method = "ANGLE"
    set_smooth(result)
    return result


def add_curve(name, points, material, target, bevel=0.014):
    curve = bpy.data.curves.new(name, type="CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 16
    curve.bevel_depth = bevel
    curve.bevel_resolution = 3
    spline = curve.splines.new("NURBS")
    spline.points.add(len(points) - 1)
    for node, point in zip(spline.points, points):
        node.co = (*point, 1)
    spline.order_u = min(3, len(points))
    spline.use_endpoint_u = True
    result = bpy.data.objects.new(name, curve)
    curve.materials.append(material)
    target.objects.link(result)
    return result


def keyframe_transform(item, frame, location=None, rotation=None, scale=None):
    if location is not None:
        item.location = location
        item.keyframe_insert(data_path="location", frame=frame)
    if rotation is not None:
        item.rotation_euler = rotation
        item.keyframe_insert(data_path="rotation_euler", frame=frame)
    if scale is not None:
        item.scale = scale
        item.keyframe_insert(data_path="scale", frame=frame)


def look_at(item, target):
    constraint = item.constraints.new(type="TRACK_TO")
    constraint.target = target
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"


def add_area(name, location, energy, size, colour_value, target, shape="DISK"):
    bpy.ops.object.light_add(type="AREA", location=location)
    result = bpy.context.object
    result.name = name
    result.data.energy = energy
    result.data.shape = shape
    result.data.size = size
    result.data.color = colour(colour_value)[:3]
    move_to(result, target)
    return result


def configure_scene():
    scene = bpy.context.scene
    scene.frame_start = CONTRACT["frameStart"]
    scene.frame_end = CONTRACT["frameEnd"]
    scene.render.engine = "CYCLES"
    try:
        preferences = bpy.context.preferences.addons["cycles"].preferences
        preferences.get_devices()
        for device in preferences.devices:
            device.use = device.type in {"OPTIX", "CUDA", "HIP", "METAL"}
        for backend in ("OPTIX", "CUDA"):
            try:
                preferences.compute_device_type = backend
                break
            except TypeError:
                continue
        scene.cycles.device = "GPU"
    except (AttributeError, KeyError, TypeError):
        # A CPU fallback remains functional if a render host lacks Cycles GPU support.
        scene.cycles.device = "CPU"
    scene.cycles.samples = CONTRACT["render"]["sequenceSamples"]
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.use_denoising = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.resolution_percentage = 100
    scene.render.fps = CONTRACT["fps"]
    scene.render.film_transparent = False
    scene.world.use_nodes = True
    world_background = scene.world.node_tree.nodes.get("Background")
    world_background.inputs["Color"].default_value = colour(PALETTE["void"])
    world_background.inputs["Strength"].default_value = 0.012
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.use_file_extension = True
    scene.render.image_settings.color_depth = "8"
    # Blender 5.2 moved compositor ownership away from Scene.node_tree. Keep
    # this render path API-stable; the browser receives final images and the
    # material/light/VFX rig remains the primary fidelity mechanism.
    return scene


def create_smoke(target):
    material = bpy.data.materials.new("M_Smoke_Volume")
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    volume = nodes.new("ShaderNodeVolumePrincipled")
    volume.inputs["Color"].default_value = colour(PALETTE["smoke"])
    volume.inputs["Density"].default_value = 0.12
    volume.inputs["Anisotropy"].default_value = 0.18
    noise = nodes.new("ShaderNodeTexNoise")
    noise.noise_dimensions = "4D"
    noise.inputs["Scale"].default_value = 1.45
    noise.inputs["Detail"].default_value = 4.0
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.38
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].color = (0.26, 0.26, 0.26, 1)
    density = nodes.new("ShaderNodeMath")
    density.operation = "MULTIPLY"
    density.inputs[1].default_value = 0.018
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], density.inputs[0])
    links.new(density.outputs["Value"], volume.inputs["Density"])
    links.new(volume.outputs["Volume"], output.inputs["Volume"])
    smoke_volumes = (
        ((0, 1.4, .55), (3.8, 2.2, 1.8)),
        ((-2.9, 1.8, 1.0), (2.1, 1.5, 1.4)),
        ((3.1, 2.0, 1.2), (2.6, 1.8, 1.6)),
    )
    for index, (location, scale) in enumerate(smoke_volumes):
        bpy.ops.mesh.primitive_cube_add(size=2, location=location)
        item = bpy.context.object
        item.name = f"Smoke_{index:02d}"
        item.scale = scale
        item.data.materials.append(material)
        move_to(item, target)


def build_scene():
    random.seed(20260725)
    clean_scene()
    scene = configure_scene()
    geo_core = make_collection("GEO_CORE")
    geo_bands = make_collection("GEO_FORGED_BANDS")
    geo_orbits = make_collection("GEO_INNER_ORBITS")
    geo_cage = make_collection("GEO_NETWORK_CAGE")
    geo_nodes = make_collection("GEO_NETWORK_NODES")
    geo_ground = make_collection("GEO_GROUND")
    vfx_electric = make_collection("VFX_ELECTRICITY")
    vfx_sparks = make_collection("VFX_SPARKS")
    vfx_smoke = make_collection("VFX_SMOKE")
    lights = make_collection("LIGHTS")
    cameras = make_collection("CAMERAS")

    black = metal_material("M_Black_Forged_Core", "#030506", 0.26, black=True)
    forged = metal_material("M_Hammered_Forged_Brass", PALETTE["brass"], 0.26, bright=True)
    polished = metal_material("M_Polished_Brass", PALETTE["brassHighlight"], 0.17, bright=True)
    ember = emissive_material("M_Ember", PALETTE["amber"], 12.0)
    energy = emissive_material("M_Electric_Amber", "#ffd39b", 18.0)

    core = add_uv_sphere("Core_Black_Forged", 1.38, (0, 0, .16), black, geo_core, segments=96)
    core.scale = (.82, .82, .82)
    displacement = core.modifiers.new("Fine_Forged_Imperfection", "DISPLACE")
    texture = bpy.data.textures.new("Core_Forged_Noise", type="CLOUDS")
    texture.noise_scale = 0.28
    texture.noise_depth = 2
    displacement.texture = texture
    displacement.strength = 0.035
    keyframe_transform(core, 1, location=(0, 0, -1.35), rotation=(.18, -.42, .08), scale=(.12, .12, .12))
    keyframe_transform(core, 27, location=(0, 0, .16), rotation=(.25, -.2, .2), scale=(.82, .82, .82))
    keyframe_transform(core, 108, location=(0, 0, .16), rotation=(.35, .42, .62), scale=(.82, .82, .82))

    band_specs = [
        ("Forged_Band_Top", 3.22, .34, .16, math.radians(202), math.radians(338), (math.radians(34), math.radians(-8), math.radians(-21)), (-2.4, .3, 2.2)),
        ("Forged_Band_Right", 3.05, .36, .17, math.radians(18), math.radians(142), (math.radians(78), math.radians(28), math.radians(31)), (2.5, -.15, .65)),
        ("Forged_Band_Lower", 3.34, .32, .15, math.radians(218), math.radians(343), (math.radians(45), math.radians(-26), math.radians(59)), (-1.85, -.18, -1.75)),
    ]
    for index, (name, major, width, thick, start, end, rotation, initial) in enumerate(band_specs):
        band = add_band(name, major, width, thick, start, end, rotation, forged, geo_bands)
        settled_rotation = Vector(rotation)
        keyframe_transform(band, 1, location=initial, rotation=(rotation[0] + .5, rotation[1] - .35, rotation[2] + .45), scale=(.62, .62, .62))
        keyframe_transform(band, 31 + index * 6, location=(0, 0, 0), rotation=settled_rotation, scale=(1, 1, 1))
        keyframe_transform(band, 108, location=(0, 0, 0), rotation=(rotation[0] + .07, rotation[1] + .11, rotation[2] + .18), scale=(1, 1, 1))

    orbit_specs = [
        (2.07, .075, (math.radians(65), math.radians(12), math.radians(-28))),
        (1.78, .064, (math.radians(17), math.radians(76), math.radians(35))),
        (1.47, .052, (math.radians(110), math.radians(18), math.radians(-36))),
        (2.43, .038, (math.radians(34), math.radians(-42), math.radians(63))),
    ]
    for index, (major, minor, rotation) in enumerate(orbit_specs):
        orbit = add_torus(f"Inner_Orbit_{index + 1}", major, minor, rotation, polished, geo_orbits)
        keyframe_transform(orbit, 1, scale=(.001, .001, .001))
        keyframe_transform(orbit, 42 + index * 5, scale=(1, 1, 1), rotation=rotation)
        keyframe_transform(orbit, 108, scale=(1, 1, 1), rotation=(rotation[0] + .32 * (index + 1), rotation[1] - .21 * (index + 1), rotation[2] + .25 * (index + 1)))

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=2.55)
    cage = bpy.context.object
    cage.name = "Network_Cage"
    cage.data.materials.append(polished)
    wire = cage.modifiers.new("Fine_Network_Wire", "WIREFRAME")
    wire.thickness = .013
    wire.use_even_offset = True
    move_to(cage, geo_cage)
    keyframe_transform(cage, 1, scale=(.001, .001, .001))
    keyframe_transform(cage, 63, scale=(1, 1, 1), rotation=(0, 0, 0))
    keyframe_transform(cage, 108, scale=(1, 1, 1), rotation=(.15, -.22, .28))

    vertices = [vertex.co.normalized() for vertex in cage.data.vertices]
    for index, point in enumerate(vertices[::3]):
        point *= 2.56
        radius = .052 + (index % 4) * .013
        node = add_uv_sphere(f"Network_Node_{index:02d}", radius, point, polished, geo_nodes, segments=24)
        keyframe_transform(node, 1, scale=(.001, .001, .001))
        keyframe_transform(node, 60 + (index % 6) * 3, scale=(1, 1, 1))
        keyframe_transform(node, 108, scale=(1.0 + (index % 3) * .1,) * 3)

    halo = add_torus("Energised_Outer_Halo", 3.08, .043, (math.radians(54), math.radians(-12), math.radians(24)), polished, geo_orbits)
    keyframe_transform(halo, 1, scale=(.001, .001, .001))
    keyframe_transform(halo, 76, scale=(1, 1, 1))
    keyframe_transform(halo, 108, rotation=(math.radians(66), math.radians(-4), math.radians(76)), scale=(1, 1, 1))

    # Electricity paths bridge initial forged-band tips toward the core.
    for arc_index, (start, end) in enumerate((((-1.72, -.35, 1.26), (-.34, -.14, .54)), ((1.9, -.2, .72), (.47, -.1, .26)), ((-1.42, -.15, -1.34), (-.27, -.1, -.48)))):
        points = []
        for segment in range(16):
            ratio = segment / 15
            jitter = (.12 * math.sin(segment * 4.5 + arc_index), .08 * math.cos(segment * 5.1), .12 * math.sin(segment * 3.3))
            point = Vector(start).lerp(Vector(end), ratio) + Vector(jitter) * math.sin(ratio * math.pi)
            points.append(point)
        arc = add_curve(f"Electric_Arc_{arc_index + 1}", points, energy, vfx_electric, bevel=.011)
        keyframe_transform(arc, 1, scale=(.001, .001, .001))
        keyframe_transform(arc, 16 + arc_index * 5, scale=(1, 1, 1))
        keyframe_transform(arc, 70 + arc_index * 3, scale=(.45, .45, .45))

    spark_mesh = None
    for index in range(235):
        angle = random.random() * math.tau
        distance = random.uniform(1.35, 4.5)
        location = Vector((math.cos(angle) * distance, random.uniform(-.5, 1.8), math.sin(angle) * distance * .64))
        if spark_mesh is None:
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=.025, location=location)
            spark = bpy.context.object
            spark_mesh = spark.data
            spark.name = "Spark_Master"
            spark.data.materials.append(ember)
            move_to(spark, vfx_sparks)
        else:
            spark = bpy.data.objects.new(f"Spark_{index:03d}", spark_mesh)
            vfx_sparks.objects.link(spark)
            spark.location = location
        size = random.uniform(.25, 1.65)
        spark.scale = (size, size * random.uniform(.4, 1.5), size)
        start = 17 + index % 48
        keyframe_transform(spark, start - 4, scale=(.001, .001, .001))
        keyframe_transform(spark, start, scale=(size, size * .7, size))
        keyframe_transform(spark, 108, location=tuple(location * random.uniform(1.1, 1.65) + Vector((0, random.uniform(.1, 1.5), 0))), scale=(.001, .001, .001))

    bpy.ops.mesh.primitive_plane_add(size=24, location=(0, 0, -1.72))
    floor = bpy.context.object
    floor.name = "Reflective_Engraved_Ground"
    floor.data.materials.append(ground_material())
    move_to(floor, geo_ground)
    for radius in (2.2, 3.0, 3.8):
        ring = add_torus(f"Ground_Engraving_{radius}", radius, .007, (0, 0, 0), polished, geo_ground)
        ring.location.z = -1.704

    backdrop_material = bpy.data.materials.new("M_Backdrop_Black")
    backdrop_material.use_nodes = True
    backdrop_bsdf = backdrop_material.node_tree.nodes.get("Principled BSDF")
    node_input(backdrop_bsdf, "Base Color").default_value = colour("#010101")
    node_input(backdrop_bsdf, "Metallic").default_value = 0.0
    node_input(backdrop_bsdf, "Roughness").default_value = 1.0
    bpy.ops.mesh.primitive_plane_add(size=24, location=(0, 4.1, 2.0), rotation=(math.radians(90), 0, 0))
    backdrop = bpy.context.object
    backdrop.name = "Void_Backdrop"
    backdrop.data.materials.append(backdrop_material)
    move_to(backdrop, geo_ground)

    create_smoke(vfx_smoke)

    target = bpy.data.objects.new("Camera_Target", None)
    cameras.objects.link(target)
    target.location = (0, 0, .2)
    target.keyframe_insert(data_path="location", frame=1)
    target.location = (-1.42, 0, .15)
    target.keyframe_insert(data_path="location", frame=108)
    bpy.ops.object.camera_add(location=(0, -11.4, 1.15))
    camera = bpy.context.object
    camera.name = "Camera_Desktop"
    camera.data.lens = 58
    camera.data.sensor_width = 36
    camera.data.dof.use_dof = True
    camera.data.dof.focus_object = core
    camera.data.dof.aperture_fstop = 3.2
    move_to(camera, cameras)
    scene.camera = camera
    look_at(camera, target)
    keyframe_transform(camera, 1, location=(0, -12.6, 1.2))
    keyframe_transform(camera, 58, location=(.22, -10.9, .85))
    keyframe_transform(camera, 108, location=(.85, -14.2, .88))

    # Preserve the reference's graphite-first, near-black exposure. Studio
    # strengths made the first V6 review read as a bright gold object instead.
    key = add_area("Key_Cool", (-3.1, -4.2, 5.4), 72, 5.2, "#c9e8ed", lights)
    look_at(key, core)
    rim = add_area("Rim_Warm", (4.4, .4, 3.8), 128, 3.4, "#ff9f58", lights)
    look_at(rim, core)
    left_rim = add_area("Rim_Amber", (-4.4, .6, 1.5), 54, 2.6, "#e67335", lights)
    look_at(left_rim, core)
    floor_light = add_area("Ground_Graze", (0, -1.2, -.5), 32, 3.0, "#e58b42", lights, shape="RECTANGLE")
    look_at(floor_light, target)
    bpy.ops.object.light_add(type="POINT", location=(0, -1.5, .5))
    contact = bpy.context.object
    contact.name = "Contact_Energy_Light"
    contact.data.energy = 260
    contact.data.color = colour("#ff9a2e")[:3]
    contact.data.shadow_soft_size = .35
    move_to(contact, lights)
    contact.data.energy = 0
    contact.data.keyframe_insert(data_path="energy", frame=1)
    contact.data.energy = 72
    contact.data.keyframe_insert(data_path="energy", frame=26)
    contact.data.energy = 56
    contact.data.keyframe_insert(data_path="energy", frame=108)
    return scene, camera, core


def render_keyframes(scene):
    path = directory(f"{CONTRACT['web']['root']}/keyframes")
    scene.render.resolution_x, scene.render.resolution_y = CONTRACT["render"]["keyframes"]
    scene.cycles.samples = CONTRACT["render"]["keyframeSamples"]
    targets = {"phase-ignition": 24, "phase-network": 62, "phase-handoff": 108}
    if KEYFRAME_ONLY:
        if KEYFRAME_ONLY not in targets:
            raise ValueError(f"Unknown keyframe target: {KEYFRAME_ONLY}")
        targets = {KEYFRAME_ONLY: targets[KEYFRAME_ONLY]}
    for name, frame in targets.items():
        scene.frame_set(frame)
        scene.render.filepath = str(path / f"{name}.png")
        bpy.ops.render.render(write_still=True)


def render_reveal(scene):
    desktop = directory(CONTRACT["web"]["desktopReveal"])
    mobile = directory(CONTRACT["web"]["mobileReveal"])
    scene.cycles.samples = CONTRACT["render"]["sequenceSamples"]
    count = CONTRACT["render"]["revealFrameCount"]
    frames = [round(1 + index * (CONTRACT["frameEnd"] - 1) / (count - 1)) for index in range(count)]
    for output, dimensions in ((desktop, CONTRACT["render"]["reveal"]), (mobile, (540, 960))):
        scene.render.resolution_x, scene.render.resolution_y = dimensions
        for index, frame in enumerate(frames, start=1):
            scene.frame_set(frame)
            scene.render.filepath = str(output / f"frame_{index:04d}.webp")
            scene.render.image_settings.file_format = "WEBP"
            scene.render.image_settings.quality = 90
            bpy.ops.render.render(write_still=True)
        scene.render.image_settings.file_format = "PNG"
    manifest = {"version": 6, "sampleCount": count, "frames": [{"desktop": f"assets/tbm-cinematic-v6/reveal-desktop/frame_{index:04d}.webp", "mobile": f"assets/tbm-cinematic-v6/reveal-mobile/frame_{index:04d}.webp"} for index in range(1, count + 1)]}
    (ROOT / CONTRACT["web"]["root"] / "frame-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def configure_card_scene(scene, camera, core):
    # Cards are their own direct-render compositions; all use Blender-generated assets.
    for item in list(bpy.data.objects):
        if item.type not in {"CAMERA", "LIGHT"}:
            item.hide_render = True
    scene.frame_set(108)
    # Card renders are still images. Remove the hero timeline after evaluating
    # its final pose so Blender cannot re-apply its F-curves during render.
    core.animation_data_clear()
    camera.animation_data_clear()
    bpy.data.objects["Camera_Target"].animation_data_clear()
    bpy.data.objects["Camera_Target"].location = (0, 0, 0)
    # These are macro texture plates, not distant hero renders: fill the card
    # crop with material and form so it remains legible behind the HTML label.
    camera.location = (0, -2.35, .18)
    camera.data.lens = 55
    core.hide_render = False
    core.location = (0, 0, 0)
    core.scale = (1.38, 1.38, 1.38)
    scene.render.resolution_x, scene.render.resolution_y = CONTRACT["render"]["cards"]
    scene.cycles.samples = CONTRACT["render"]["cardSamples"]
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = 92


def add_card_accent(kind, material):
    """Give every card a distinct Blender-rendered macro composition."""
    created = []
    if kind == "beauty":
        bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, location=(-.92, .05, .1), scale=(.46, .46, 1.42))
        created.append(bpy.context.object)
        bpy.ops.mesh.primitive_torus_add(major_radius=1.42, minor_radius=.075, major_segments=96, minor_segments=16, rotation=(math.radians(75), math.radians(16), math.radians(24)))
        created.append(bpy.context.object)
    elif kind == "home":
        for radius, rotation in ((1.28, (math.radians(72), math.radians(12), math.radians(8))), (1.72, (math.radians(104), math.radians(-24), math.radians(41)))):
            bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=.13, major_segments=96, minor_segments=16, rotation=rotation)
            created.append(bpy.context.object)
    elif kind == "toys":
        for location, rotation, scale in (((-.9, .05, .45), (.25, .42, .1), (.62, .62, .62)), ((.88, .08, -.35), (.5, -.2, .45), (.42, .42, .42))):
            bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation, scale=scale)
            cube = bpy.context.object
            bevel = cube.modifiers.new("Soft_Forged_Edges", "BEVEL")
            bevel.width = .13
            bevel.segments = 4
            created.append(cube)
    elif kind == "electronics":
        bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.72, depth=.26, location=(.55, .18, .12), rotation=(math.radians(73), 0, math.radians(24)))
        created.append(bpy.context.object)
        bpy.ops.mesh.primitive_torus_add(major_radius=1.05, minor_radius=.06, major_segments=96, minor_segments=16, rotation=(math.radians(73), 0, math.radians(24)))
        created.append(bpy.context.object)
    else:
        for z, rotation in ((.62, (math.radians(68), math.radians(11), math.radians(17))), (-.58, (math.radians(77), math.radians(-14), math.radians(29)))):
            bpy.ops.mesh.primitive_plane_add(size=3.7, location=(0, .35, z), rotation=rotation)
            plane = bpy.context.object
            solidify = plane.modifiers.new("Layered_Material", "SOLIDIFY")
            solidify.thickness = .08
            bevel = plane.modifiers.new("Soft_Layer_Edges", "BEVEL")
            bevel.width = .09
            bevel.segments = 3
            created.append(plane)
    for item in created:
        item.data.materials.append(material)
    return created


def render_cards(scene, camera, core):
    path = directory(CONTRACT["web"]["productFocus"])
    configure_card_scene(scene, camera, core)
    cards = [
        ("beauty", "beauty", "#8a5848", .29, (0.12, .62, .18), (1.15, 1.15, 1.15)),
        ("home-kitchen", "home", "#1b2529", .48, (.28, .12, .48), (1.25, 1.25, 1.25)),
        ("toys-games", "toys", "#9b632c", .25, (.50, .58, .12), (1.10, 1.10, 1.10)),
        ("electronics", "electronics", "#172b35", .19, (.16, .72, .42), (1.20, 1.20, 1.20)),
        ("general-merchandise", "general", "#635247", .54, (.44, .10, .36), (1.30, 1.30, 1.30)),
    ]
    for index, (name, kind, tone, roughness, rotation, scale) in enumerate(cards):
        material = metal_material(f"M_Card_{name}", tone, roughness)
        core.data.materials.clear()
        core.data.materials.append(material)
        core.rotation_euler = rotation
        core.scale = scale
        core.location = ((index - 2) * .08, .15, .05)
        accents = add_card_accent(kind, material)
        # Macro cards can carry richer material contrast than the settled hero.
        bpy.data.objects["Key_Cool"].data.energy = 150
        bpy.data.objects["Rim_Warm"].data.energy = 110
        scene.render.filepath = str(path / f"{name}.webp")
        bpy.ops.render.render(write_still=True)
        for accent in accents:
            bpy.data.objects.remove(accent, do_unlink=True)


def main():
    scene, camera, core = build_scene()
    blend = ROOT / "blender/reference-match/TBM_REFERENCE_MATCH_MASTER.blend"
    blend.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    if MODE == "keyframes":
        render_keyframes(scene)
    elif MODE == "reveal":
        render_reveal(scene)
    elif MODE == "cards":
        render_cards(scene, camera, core)
    elif MODE == "all":
        render_keyframes(scene)
        render_reveal(scene)
        render_cards(scene, camera, core)
    else:
        raise ValueError(f"Unknown render mode: {MODE}")


if __name__ == "__main__":
    main()
