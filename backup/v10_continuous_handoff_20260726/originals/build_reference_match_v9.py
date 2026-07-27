"""Build and render the evidence-gated V9 reference-match scene in Blender 5.2.

Usage from repository root:
  & "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" --background --python blender/reference-match-v9/scripts/build_reference_match_v9.py -- --render keyframes
  & "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" --background --python blender/reference-match-v9/scripts/build_reference_match_v9.py -- --render reveal
  & "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" --background --python blender/reference-match-v9/scripts/build_reference_match_v9.py -- --render cards

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
CONTRACT = json.loads((ROOT / "blender/reference-match-v9/config/scene-contract.json").read_text(encoding="utf-8"))
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


def metal_material(
    name: str,
    base: str,
    roughness: float,
    *,
    bright: bool = False,
    black: bool = False,
    noise_scale: float = 6.0,
    bump_strength: float = 0.08,
    bump_distance: float = 0.035,
):
    """Create material roles with deliberate smooth-versus-forged separation.

    V8 flattened these roles in the browser. V9 renders them in Blender and
    never replaces their values at runtime.
    """
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    node_input(bsdf, "Base Color").default_value = colour(base)
    node_input(bsdf, "Metallic").default_value = 0.96 if not black else 0.38
    node_input(bsdf, "Roughness").default_value = roughness
    if black:
        clearcoat = node_input(bsdf, "Coat Weight") or node_input(bsdf, "Clearcoat")
        if clearcoat:
            clearcoat.default_value = 0.82
        coat_rough = node_input(bsdf, "Coat Roughness") or node_input(bsdf, "Clearcoat Roughness")
        if coat_rough:
            coat_rough.default_value = 0.16
    texture = nodes.new("ShaderNodeTexNoise")
    texture.inputs["Scale"].default_value = noise_scale
    texture.inputs["Detail"].default_value = 4.0
    texture.inputs["Roughness"].default_value = 0.58
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.28
    ramp.color_ramp.elements[1].position = 0.72
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = bump_strength
    bump.inputs["Distance"].default_value = bump_distance
    rough_map = nodes.new("ShaderNodeMapRange")
    rough_map.inputs["From Min"].default_value = 0.12
    rough_map.inputs["From Max"].default_value = 0.9
    rough_map.inputs["To Min"].default_value = max(0.04, roughness - 0.05)
    rough_map.inputs["To Max"].default_value = min(0.62, roughness + 0.08)
    links.new(texture.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], node_input(bsdf, "Normal"))
    links.new(texture.outputs["Fac"], rough_map.inputs["Value"])
    links.new(rough_map.outputs["Result"], node_input(bsdf, "Roughness"))
    if bright:
        emission = node_input(bsdf, "Emission Color")
        strength = node_input(bsdf, "Emission Strength")
        if emission and strength:
            emission.default_value = colour("#57210b")
            strength.default_value = 0.045
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


def add_orbit_curve(name, major, rotation, material, target):
    """Create a circular bevelled curve so the orbit can grow along its path."""
    curve = bpy.data.curves.new(name, type="CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 24
    curve.bevel_depth = 0.055
    curve.bevel_resolution = 4
    spline = curve.splines.new("POLY")
    segments = 160
    spline.points.add(segments)
    for index, point in enumerate(spline.points):
        angle = math.tau * index / segments
        point.co = (major * math.cos(angle), major * math.sin(angle), 0.0, 1.0)
    spline.use_cyclic_u = True
    result = bpy.data.objects.new(name, curve)
    curve.materials.append(material)
    result.rotation_euler = rotation
    target.objects.link(result)
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


def apply_smooth_fcurves():
    """Use clamped Bezier handles for smooth, bounded assembly motion."""
    for item in bpy.data.objects:
        animation = item.animation_data
        action = animation.action if animation else None
        if not action:
            continue
        curves = []
        if hasattr(action, "fcurves"):
            curves.extend(action.fcurves)
        else:
            for layer in action.layers:
                for strip in layer.strips:
                    for channelbag in strip.channelbags:
                        curves.extend(channelbag.fcurves)
        for curve in curves:
            for point in curve.keyframe_points:
                point.interpolation = "BEZIER"
                point.handle_left_type = "AUTO_CLAMPED"
                point.handle_right_type = "AUTO_CLAMPED"


def add_progressive_cage_edges(source, material, target):
    """Render cage edges as independently growing bevelled curves."""
    result = []
    vertices = [source.matrix_world @ vertex.co for vertex in source.data.vertices]
    ordered_edges = sorted(
        source.data.edges,
        key=lambda edge: min(vertices[edge.vertices[0]].z, vertices[edge.vertices[1]].z),
    )
    for index, edge in enumerate(ordered_edges):
        points = [vertices[edge.vertices[0]], vertices[edge.vertices[1]]]
        line = add_curve(f"Network_Edge_{index:03d}", points, material, target, bevel=.013)
        line.data.bevel_factor_start = 0.0
        line.data.bevel_factor_end = 0.0
        # Three staggered waves make the cage visibly draw itself instead of
        # appearing as a completed shell.
        start = 142 + (index % 54)
        end = start + 18
        line.data.keyframe_insert(data_path="bevel_factor_end", frame=start)
        line.data.bevel_factor_end = 1.0
        line.data.keyframe_insert(data_path="bevel_factor_end", frame=end)
        result.append(line)
    return result


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

    # Material roles are intentionally not uniform: a lacquered graphite core,
    # smooth polished orbits/network and visibly forged outer bands.
    black = metal_material(
        "M_Black_Lacquered_Core", "#081013", 0.17,
        black=True, noise_scale=19.0, bump_strength=0.035, bump_distance=0.012,
    )
    forged = metal_material(
        "M_Forged_Outer_Brass", PALETTE["brass"], 0.41,
        bright=True, noise_scale=4.2, bump_strength=0.22, bump_distance=0.072,
    )
    polished = metal_material(
        "M_Polished_Bronze", PALETTE["brassHighlight"], 0.205,
        bright=True, noise_scale=10.5, bump_strength=0.035, bump_distance=0.012,
    )
    network = metal_material(
        "M_Fine_Network_Bronze", "#c98542", 0.245,
        bright=True, noise_scale=14.0, bump_strength=0.025, bump_distance=0.009,
    )
    ember = emissive_material("M_Ember", PALETTE["amber"], 15.0)
    energy = emissive_material("M_Electric_Amber", "#ffe0a4", 20.0)

    core = add_uv_sphere("Core_Black_Forged", 1.38, (0, 0, .16), black, geo_core, segments=96)
    core.scale = (.82, .82, .82)
    displacement = core.modifiers.new("Fine_Forged_Imperfection", "DISPLACE")
    texture = bpy.data.textures.new("Core_Forged_Noise", type="CLOUDS")
    texture.noise_scale = 0.28
    texture.noise_depth = 2
    displacement.texture = texture
    displacement.strength = 0.012
    keyframe_transform(core, 1, location=(0, 0, -1.62), rotation=(.18, -.42, .08), scale=(.08, .08, .08))
    # The opening must read as a deliberate core emergence, not an almost
    # invisible dot.  This is isolated from the final-pose and camera keys.
    keyframe_transform(core, 18, location=(0, 0, -1.32), rotation=(.20, -.38, .10), scale=(.48, .48, .48))
    keyframe_transform(core, 38, location=(0, 0, -.98), rotation=(.21, -.34, .12), scale=(.62, .62, .62))
    keyframe_transform(core, 64, location=(0, 0, -.42), rotation=(.24, -.27, .16), scale=(.72, .72, .72))
    keyframe_transform(core, 86, location=(0, 0, .20), rotation=(.27, -.18, .22), scale=(.86, .86, .86))
    keyframe_transform(core, 216, location=(0, 0, .16), rotation=(.38, .48, .68), scale=(.82, .82, .82))

    band_specs = [
        ("Forged_Band_Top", 3.22, .34, .16, math.radians(202), math.radians(338), (math.radians(34), math.radians(-8), math.radians(-21)), (-2.4, .3, 2.2)),
        ("Forged_Band_Right", 3.05, .36, .17, math.radians(18), math.radians(142), (math.radians(78), math.radians(28), math.radians(31)), (2.5, -.15, .65)),
        ("Forged_Band_Lower", 3.34, .32, .15, math.radians(218), math.radians(343), (math.radians(45), math.radians(-26), math.radians(59)), (-1.85, -.18, -1.75)),
    ]
    for index, (name, major, width, thick, start, end, rotation, initial) in enumerate(band_specs):
        band = add_band(name, major, width, thick, start, end, rotation, forged, geo_bands)
        settled_rotation = Vector(rotation)
        approach = 48 + index * 12
        contact = 82 + index * 14
        keyframe_transform(band, 1, location=initial, rotation=(rotation[0] + .72, rotation[1] - .52, rotation[2] + .64), scale=(.56, .56, .56))
        keyframe_transform(band, approach, location=tuple(Vector(initial) * .42), rotation=(rotation[0] + .27, rotation[1] - .18, rotation[2] + .28), scale=(.84, .84, .84))
        keyframe_transform(band, contact - 5, location=(.08 * (-1 if index % 2 else 1), 0, .05), rotation=(rotation[0] - .04, rotation[1] + .06, rotation[2] - .05), scale=(1.025, 1.025, 1.025))
        keyframe_transform(band, contact, location=(0, 0, 0), rotation=settled_rotation, scale=(1, 1, 1))
        keyframe_transform(band, 216, location=(0, 0, 0), rotation=(rotation[0] + .06, rotation[1] + .09, rotation[2] + .14), scale=(1, 1, 1))

    orbit_specs = [
        (2.07, (math.radians(65), math.radians(12), math.radians(-28))),
        (1.78, (math.radians(17), math.radians(76), math.radians(35))),
        (1.47, (math.radians(110), math.radians(18), math.radians(-36))),
        (2.43, (math.radians(34), math.radians(-42), math.radians(63))),
    ]
    for index, (major, rotation) in enumerate(orbit_specs):
        orbit = add_orbit_curve(f"Inner_Orbit_{index + 1}", major, rotation, polished, geo_orbits)
        reveal_start = 106 + index * 11
        reveal_end = reveal_start + 28
        orbit.data.bevel_factor_start = 0.0
        orbit.data.bevel_factor_end = 0.0
        keyframe_transform(orbit, 1, rotation=(rotation[0] - .24, rotation[1] + .18, rotation[2] - .22), scale=(.001, .001, .001))
        orbit.data.keyframe_insert(data_path="bevel_factor_end", frame=reveal_start)
        orbit.data.bevel_factor_end = 1.0
        orbit.data.keyframe_insert(data_path="bevel_factor_end", frame=reveal_end)
        keyframe_transform(orbit, reveal_start, rotation=(rotation[0] - .16, rotation[1] + .12, rotation[2] - .14), scale=(.86, .86, .86))
        keyframe_transform(orbit, reveal_end - 4, rotation=(rotation[0] + .03, rotation[1] - .02, rotation[2] + .04), scale=(1.025, 1.025, 1.025))
        keyframe_transform(orbit, reveal_end, rotation=rotation, scale=(1, 1, 1))
        keyframe_transform(orbit, 216, rotation=(rotation[0] + .24 * (index + 1), rotation[1] - .17 * (index + 1), rotation[2] + .20 * (index + 1)), scale=(1, 1, 1))

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=2.55)
    cage = bpy.context.object
    cage.name = "Network_Cage"
    cage.data.materials.append(network)
    wire = cage.modifiers.new("Fine_Network_Wire", "WIREFRAME")
    wire.thickness = .013
    wire.use_even_offset = True
    move_to(cage, geo_cage)
    cage.hide_render = True
    progressive_edges = add_progressive_cage_edges(cage, network, geo_cage)

    vertices = [vertex.co.normalized() for vertex in cage.data.vertices]
    for index, point in enumerate(vertices[::3]):
        point *= 2.56
        radius = .052 + (index % 4) * .013
        node = add_uv_sphere(f"Network_Node_{index:02d}", radius, point, network, geo_nodes, segments=24)
        arrival = 150 + (index % 10) * 5
        keyframe_transform(node, arrival - 3, scale=(.001, .001, .001))
        keyframe_transform(node, arrival, scale=(1.35, 1.35, 1.35))
        keyframe_transform(node, arrival + 5, scale=(1, 1, 1))
        keyframe_transform(node, 216, scale=(1.0 + (index % 3) * .07,) * 3)

    halo = add_torus("Energised_Outer_Halo", 3.08, .043, (math.radians(54), math.radians(-12), math.radians(24)), polished, geo_orbits)
    keyframe_transform(halo, 166, scale=(.001, .001, .001))
    keyframe_transform(halo, 190, scale=(1.04, 1.04, 1.04))
    keyframe_transform(halo, 198, scale=(1, 1, 1))
    keyframe_transform(halo, 216, rotation=(math.radians(66), math.radians(-4), math.radians(76)), scale=(1, 1, 1))

    # Electricity paths bridge initial forged-band tips toward the core.
    for arc_index, (start, end) in enumerate((((-1.72, -.35, 1.26), (-.34, -.14, .54)), ((1.9, -.2, .72), (.47, -.1, .26)), ((-1.42, -.15, -1.34), (-.27, -.1, -.48)))):
        points = []
        for segment in range(16):
            ratio = segment / 15
            jitter = (.12 * math.sin(segment * 4.5 + arc_index), .08 * math.cos(segment * 5.1), .12 * math.sin(segment * 3.3))
            point = Vector(start).lerp(Vector(end), ratio) + Vector(jitter) * math.sin(ratio * math.pi)
            points.append(point)
        arc = add_curve(f"Electric_Arc_{arc_index + 1}", points, energy, vfx_electric, bevel=.011)
        arc_start = 34 + arc_index * 13
        keyframe_transform(arc, arc_start - 2, scale=(.001, .001, .001))
        keyframe_transform(arc, arc_start, scale=(1, 1, 1))
        keyframe_transform(arc, arc_start + 20, scale=(.72, .72, .72))
        keyframe_transform(arc, 166 + arc_index * 3, scale=(.18, .18, .18))

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
        start = 28 + index % 118
        keyframe_transform(spark, start - 4, scale=(.001, .001, .001))
        keyframe_transform(spark, start, scale=(size, size * .7, size))
        keyframe_transform(spark, min(188, start + 32), location=tuple(location * random.uniform(1.1, 1.65) + Vector((0, random.uniform(.1, 1.5), 0))), scale=(.001, .001, .001))

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
    target.location = (-1.28, 0, .15)
    target.keyframe_insert(data_path="location", frame=216)
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
    # One owner for reveal composition: all camera movement is authored here.
    # The final pull-back reserves a readable left-copy area without shrinking
    # the sculpture into a distant thumbnail.
    keyframe_transform(camera, 1, location=(0, -15.10, 1.28))
    keyframe_transform(camera, 72, location=(-.06, -13.90, 1.02))
    keyframe_transform(camera, 128, location=(.12, -12.58, .94))
    keyframe_transform(camera, 174, location=(.42, -14.05, .94))
    keyframe_transform(camera, 216, location=(.92, -16.72, .96))

    # Mobile is an independently composed camera, not a portrait crop of the
    # right-weighted desktop plate.  It keeps the same source animation and
    # material/light rig while centring the sculpture in the narrow viewport.
    mobile_target = bpy.data.objects.new("Camera_Target_Mobile", None)
    cameras.objects.link(mobile_target)
    for frame, location in ((1, (0, 0, .15)), (72, (0, 0, .12)), (128, (0, 0, .10)), (174, (0, 0, .12)), (216, (0, 0, .12))):
        mobile_target.location = location
        mobile_target.keyframe_insert(data_path="location", frame=frame)
    bpy.ops.object.camera_add(location=(0, -18.6, 1.18))
    mobile_camera = bpy.context.object
    mobile_camera.name = "Camera_Mobile"
    mobile_camera.data.lens = 50
    mobile_camera.data.sensor_width = 36
    mobile_camera.data.dof.use_dof = True
    mobile_camera.data.dof.focus_object = core
    mobile_camera.data.dof.aperture_fstop = 3.6
    move_to(mobile_camera, cameras)
    look_at(mobile_camera, mobile_target)
    keyframe_transform(mobile_camera, 1, location=(0, -18.6, 1.18))
    keyframe_transform(mobile_camera, 72, location=(0, -17.1, 1.02))
    keyframe_transform(mobile_camera, 128, location=(0, -15.7, .92))
    keyframe_transform(mobile_camera, 174, location=(0, -17.4, .96))
    keyframe_transform(mobile_camera, 216, location=(0, -19.8, 1.02))

    # Brighter, more legible scene separation without replacing the dark forge.
    key = add_area("Key_Cool", (-3.1, -4.2, 5.4), 132, 5.2, "#d5f3f2", lights)
    look_at(key, core)
    rim = add_area("Rim_Warm", (4.4, .4, 3.8), 236, 3.4, "#ffc17b", lights)
    look_at(rim, core)
    left_rim = add_area("Rim_Amber", (-4.4, .6, 1.5), 104, 2.6, "#f29a4a", lights)
    look_at(left_rim, core)
    floor_light = add_area("Ground_Graze", (0, -1.2, -.5), 64, 3.0, "#f0a25a", lights, shape="RECTANGLE")
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
    contact.data.energy = 118
    contact.data.keyframe_insert(data_path="energy", frame=26)
    contact.data.energy = 82
    contact.data.keyframe_insert(data_path="energy", frame=216)
    apply_smooth_fcurves()
    return scene, camera, mobile_camera, core


def render_keyframes(scene):
    path = directory(f"{CONTRACT['web']['root']}/keyframes")
    scene.render.resolution_x, scene.render.resolution_y = CONTRACT["render"]["keyframes"]
    scene.cycles.samples = CONTRACT["render"]["keyframeSamples"]
    # These are the fixed V9 approval shots.  Their names deliberately map to
    # the contract rather than to a one-off render run, so camera, material and
    # timing changes are compared at identical source frames.
    targets = {
        "phase-opening": CONTRACT["approvalFrames"]["opening"],
        "phase-outer-formation": CONTRACT["approvalFrames"]["outerFormation"],
        "phase-cinematic-push": CONTRACT["approvalFrames"]["cinematicPush"],
        "phase-network": CONTRACT["approvalFrames"]["network"],
        "phase-handoff": CONTRACT["approvalFrames"]["handoff"],
    }
    if KEYFRAME_ONLY:
        if KEYFRAME_ONLY not in targets:
            raise ValueError(f"Unknown keyframe target: {KEYFRAME_ONLY}")
        targets = {KEYFRAME_ONLY: targets[KEYFRAME_ONLY]}
    for name, frame in targets.items():
        scene.frame_set(frame)
        scene.render.filepath = str(path / f"{name}.png")
        bpy.ops.render.render(write_still=True)


def render_reveal(scene, desktop_camera, mobile_camera):
    desktop = directory(CONTRACT["web"]["desktopReveal"])
    mobile = directory(CONTRACT["web"]["mobileReveal"])
    # Delivery frames use the same Cycles renderer as the approval stills.
    # Eevee was rejected here because it flattened the accepted material and
    # lighting balance.  Denoised lower-sample delivery frames retain the
    # visual source rather than substituting a second renderer.
    scene.render.engine = "CYCLES"
    scene.cycles.samples = CONTRACT["render"]["sequenceSamples"]
    count = CONTRACT["selectedRevealFrameCount"]
    frames = [round(1 + index * (CONTRACT["frameEnd"] - 1) / (count - 1)) for index in range(count)]
    for output, dimensions, camera in (
        (desktop, CONTRACT["render"]["reveal"], desktop_camera),
        (mobile, CONTRACT["render"]["revealMobile"], mobile_camera),
    ):
        scene.camera = camera
        scene.render.resolution_x, scene.render.resolution_y = dimensions
        for index, frame in enumerate(frames, start=1):
            scene.frame_set(frame)
            scene.render.filepath = str(output / f"frame_{index:04d}.webp")
            scene.render.image_settings.file_format = "WEBP"
            scene.render.image_settings.quality = CONTRACT["render"]["revealWebpQuality"]
            bpy.ops.render.render(write_still=True)
        scene.render.image_settings.file_format = "PNG"
    manifest = {
        "version": 9,
        "sampleCount": count,
        "frames": [
            {
                "desktop": f"assets/tbm-cinematic-v9/reveal-desktop/frame_{index:04d}.webp",
                "mobile": f"assets/tbm-cinematic-v9/reveal-mobile/frame_{index:04d}.webp",
            }
            for index in range(1, count + 1)
        ],
    }
    (ROOT / CONTRACT["web"]["root"] / "frame-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def render_reveal_preview(scene, desktop_camera, mobile_camera):
    """Render a small Cycles diagnostic set before replacing delivery assets."""
    path = directory("artifacts/reference-match-v9/cycles-delivery-preview")
    scene.render.engine = "CYCLES"
    scene.cycles.samples = CONTRACT["render"]["sequenceSamples"]
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = CONTRACT["render"]["revealWebpQuality"]
    checkpoints = (("opening", 1), ("outer", 72), ("push", 128), ("handoff", 216))
    for name, camera, dimensions in (
        ("desktop", desktop_camera, CONTRACT["render"]["reveal"]),
        ("mobile", mobile_camera, CONTRACT["render"]["revealMobile"]),
    ):
        scene.camera = camera
        scene.render.resolution_x, scene.render.resolution_y = dimensions
        for label, frame in checkpoints:
            scene.frame_set(frame)
            scene.render.filepath = str(path / f"{name}-{label}.webp")
            bpy.ops.render.render(write_still=True)
    scene.render.image_settings.file_format = "PNG"


def configure_card_scene(scene, camera, core):
    # Cards are their own direct-render compositions; all use Blender-generated assets.
    for item in list(bpy.data.objects):
        if item.type not in {"CAMERA", "LIGHT"}:
            item.hide_render = True
    scene.frame_set(CONTRACT["frameEnd"])
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
    scene, camera, mobile_camera, core = build_scene()
    blend = ROOT / "blender/reference-match-v9/TBM_REFERENCE_MATCH_V9.blend"
    blend.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    if MODE == "keyframes":
        render_keyframes(scene)
    elif MODE == "reveal":
        render_reveal(scene, camera, mobile_camera)
    elif MODE == "cards":
        render_cards(scene, camera, core)
    elif MODE == "reveal-preview":
        render_reveal_preview(scene, camera, mobile_camera)
    elif MODE == "all":
        render_keyframes(scene)
        render_reveal(scene, camera, mobile_camera)
        render_cards(scene, camera, core)
    else:
        raise ValueError(f"Unknown render mode: {MODE}")


if __name__ == "__main__":
    main()
