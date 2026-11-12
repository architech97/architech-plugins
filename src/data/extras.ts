import type { Product } from './types'

// Products outside the Revit C# suite. Text is taken from each product's own README or
// repository description; requirements are as published by the product.
export const EXTRAS: Omit<Product, 'dialogs'>[] = [
  {
    slug: 'architech-i3d', key: 'I3D', name: 'ArchiTECH I3D', suite: 'i3d', panel: 'Desktop app',
    software: ['Revit', 'Windows desktop'], revit: ['2024'], status: 'available', platform: 'Windows 10/11 x64',
    tagline: 'Turn a product photo into a sized, textured Revit family, entirely on your own computer.',
    description: 'ArchiTECH I3D turns a single product photo, or an existing mesh, into a dimensioned, textured 3D asset and places it in Revit as a native family. Shape generation, photo texturing, mesh finishing and export all run on the local machine; nothing is uploaded unless you choose the optional Meshy cloud engine.',
    problem: 'Turning a manufacturer\'s product photo into a usable, correctly sized Revit family normally means modelling it from scratch.',
    capabilities: [
      'Start from one product photo, or from a mesh you already have.',
      'Type the real size; the model is scaled to it before export.',
      'Generate the shape and paint it from the photo on a local NVIDIA GPU, or choose the optional Meshy cloud engine.',
      'Check it in clay, textured and wireframe views, then export to Revit as a native family, or to CAD formats.',
      'Revit gets a small export-and-place connector; all the work happens in one desktop app.',
    ],
    safeguards: [
      'Runs locally: nothing is uploaded unless you choose the optional Meshy cloud engine.',
      'A saved file, a loaded family and a placed instance are reported as distinct outcomes.',
      'Source geometry and accepted texture colours are preserved unless an explicit operation changes them.',
    ],
    requirements: [
      'Windows 10/11 x64, .NET Framework 4.8',
      'NVIDIA GPU, 12 GB VRAM recommended (8 GB minimum for shape only), driver 550+',
      '32 GB RAM recommended, 30 GB free disk',
      'Full Revit 2024 for RFA export (Revit LT is not supported)',
    ],
    media: [
      { src: 'media/i3d/material-workspace.webp', alt: 'Native I3D Material workspace showing a textured chair mesh before export', kind: 'image' },
      { src: 'media/i3d/workflow.gif', alt: 'I3D workflow animation: source, geometry preparation, Revit family', kind: 'animation' },
      { src: 'media/i3d/revit-placement-0.6.36.webp', alt: 'An I3D asset placed in Revit as a native family', kind: 'image' },
    ],
  },
  {
    slug: 'revit-mcp', key: 'RevitMCP', name: 'ArchiTECH MCP Connector (Revit)', suite: 'ai', panel: 'MCP connectors',
    software: ['Revit'], revit: ['2024', '2025'], status: 'enterprise',
    tagline: 'Connect Claude, Codex or Cursor to a live Revit model, with every change shown to you first.',
    description: 'The ArchiTECH MCP Connector lets an AI app work in an open Revit model on this computer only. It exposes Revit as typed tools over the Model Context Protocol, shows each request the AI app makes, and keeps the architect in control of every model write. Results are read back from the model rather than assumed.',
    problem: 'An AI assistant is only useful in a live model if you can see what it is about to change, and check what it actually did.',
    capabilities: [
      'Connect an AI app in about a minute: Claude Desktop, Claude Code, Codex, Cursor or any MCP client.',
      'Revit exposed as typed tools for reading and editing the model, on this computer only.',
      'A reviewed C# fallback for tasks the typed tools do not cover, shown to you as code to approve once.',
      'Results read back from the model, so you see what changed, not what was intended.',
    ],
    safeguards: [
      'You choose how changes are handled: automatically, asking first, or only after you confirm.',
      'Destructive changes are flagged separately and need their own approval.',
      'Every request and its result is visible in the Connector’s activity and diagnostics.',
    ],
  },
  {
    slug: 'rhino-mcp', key: 'RhinoMCP', name: 'ArchiTECH MCP Connector (Rhino)', suite: 'ai', panel: 'MCP connectors',
    software: ['Rhino'], revit: [], status: 'enterprise',
    tagline: 'Let an AI app model in Rhino 8 with native RhinoCommon commands, and check every result.',
    description: 'Rhino 8 MCP connector with native RhinoCommon execution, guarded writes, active-object counts and independent readback.',
    problem: 'AI-driven modelling in Rhino needs native execution and a way to confirm what was really created.',
    capabilities: ['Native RhinoCommon execution.', 'Active-object counts reported with each operation.'],
    safeguards: ['Guarded writes.', 'Independent readback of results.'],
  },
  {
    slug: 'sketchup-mcp', key: 'SketchUpMCP', name: 'ArchiTECH MCP Connector (SketchUp)', suite: 'ai', panel: 'MCP connectors',
    software: ['SketchUp'], revit: [], status: 'enterprise',
    tagline: 'Let an AI app build in SketchUp with checked geometry and verified positions.',
    description: 'SketchUp MCP connector with a Ruby native bridge, signed geometry tools, guarded writes and verified world-space bounds.',
    problem: 'AI-assisted massing and modelling in SketchUp needs geometry tools whose results can be trusted.',
    capabilities: ['Ruby native bridge into SketchUp.', 'Signed geometry tools.'],
    safeguards: ['Guarded writes.', 'Verified world-space bounds.'],
  },
  {
    slug: 'autocad-mcp', key: 'AutoCADMCP', name: 'ArchiTECH MCP Connector (AutoCAD)', suite: 'ai', panel: 'MCP connectors',
    software: ['AutoCAD'], revit: [], status: 'enterprise',
    tagline: 'Let an AI app draft in AutoCAD: layers, blocks, AutoLISP and DXF, with guarded changes.',
    description: 'AutoCAD MCP connector for native COM drafting, layers, blocks, AutoLISP and DXF workflows with guarded writes.',
    problem: 'Drafting automation in AutoCAD spans layers, blocks, AutoLISP and DXF, and AI access to it has to be controlled.',
    capabilities: ['Native COM drafting.', 'Layers, blocks, AutoLISP and DXF workflows.'],
    safeguards: ['Guarded writes.'],
  },
  {
    slug: 'blender-mcp', key: 'BlenderMCP', name: 'ArchiTECH MCP Connector (Blender)', suite: 'ai', panel: 'MCP connectors',
    software: ['Blender'], revit: [], status: 'enterprise',
    tagline: 'Let an AI app set up, model and render Blender scenes, with safe recovery if a step fails.',
    description: 'Blender MCP connector with a native bpy add-on, discoverable tools, guarded scene operations and explicit recovery semantics.',
    problem: 'Visualisation and scene preparation in Blender involve many repetitive scene operations that are risky to automate blindly.',
    capabilities: ['Native bpy add-on.', 'Discoverable tools for scene authoring, inspection and rendering.'],
    safeguards: ['Guarded scene operations.', 'Explicit recovery semantics.'],
  },
  {
    slug: 'architech-assistant', key: 'Assistant', name: 'ArchiTECH Assistant', suite: 'ai', panel: 'Assistant',
    software: ['Windows desktop'], revit: [], status: 'enterprise',
    tagline: 'Ask about your open Revit model, find the right tool and plan the change, in one chat.',
    description: 'ArchiTECH Assistant is a desktop chat for Revit work. Ask answers questions with a local or server model and, when allowed, web search. Search and Build work through the ArchiTECH MCP Connector: they find the right Revit operation and plan the steps in one loop, while every change to the model still goes through the Connector’s approvals.',
    problem: 'Answers about the model, the right tool for a task and a plan for the change usually live in three different places.',
    capabilities: [
      'Ask: questions about Revit and your project, answered by a local or server model, with web search when allowed.',
      'Search: finds the right Revit operation among the Connector’s typed tools.',
      'Build: plans a change step by step in one planning loop and hands it to the Connector.',
      'Reads the open model’s context: Revit version, document, active view and selection.',
      'Conversations are kept and searchable, in a light or dark theme.',
    ],
    safeguards: [
      'The Assistant never writes to Revit itself: every change goes through the Connector’s approvals.',
      'A Troubleshoot page checks the connections and opens the logs and the action audit.',
    ],
    media: [
      { src: 'media/assistant/active-view-exchange.png', alt: 'Native Assistant readback of the active Revit view, Cover', kind: 'image' },
      { src: 'media/assistant/composer-modes.png', alt: 'Native Assistant composer with Ask, Search and Build controls', kind: 'image' },
    ],
  },
]
