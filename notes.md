# First steps, learning from raw docs

- just letting it run over docs doesn't produce useful data, it either just halicunates or repeats the same thing. at best it finds some relevant external data but it is not reliable.

# 1st break-through, connecting it to a live CC worker

- the biggest impact was making it run everything through classcad directly, being able to inspect results and triage errors in real time. now it can actually know that something is wrong, and that keeps it from halucinating.

# LLMs trying to follow instructions is not easy

- the prompt has to be very carefully structured or else it kept straying off path, placing files anywhere, forgetting to write out, or straight up ignoring instructions. In the worst case it started to loop, never finishing the task.

# Iterating on the prompt and instructions

- the data output quality kept getting better. it genuinely found surprising edge cases and documented them. it even spotted a real bug in the documentation (slice keepBoth was reversed).
  - but there is still too much noise. it was missing api priorities and requirements. for instance that in order to do A, B and C are required. without this knowledge it was just trying random calls and getting errors, which was not useful data.

# Moving from domain by domain to a multi step plan

- the api was then re-structured into a multi step plan (PLAN.md), beginning with fundamentals and then building up to more complex interactions. instead of going domain by domain it is now going api by api. the data already looked much more promising.

```
Step 1: I/O Protocol & API Fundamentals
   │   (no geometry yet — pure protocol understanding)
   │
   └─► Step 2: Part Foundations
        │   (part creation → work geometry → entity injection)
        │   (now we HAVE objects — IDs become real)
        │
        ├─► Step 3: 2D Curves & Shapes
        │       (low-level geometry inside entity injection)
        │
        └─► Step 4: Constrained Sketches
                (parametric 2D geometry inside parts)
                │
                └─► Step 5: 3D Solids
                     │  (primitives, extrusions, booleans — direct operations)
                     │
                     └─► Step 6: Drawing Management & Object Properties
                          │  (NOW we have geometry: save/load, appearance, faceting, user data)
                          │
                          └─► Step 7: Part Features (Parametric Modeling)
                               │  (feature history, expressions, design intent)
                               │
                               └─► Step 8: Assemblies
                                    │  (multi-part structures, constraints, kinematics)
                                    │
                                    └─► Step 9: Technical Drawings
                                         (2D views, dimensions, DXF/SVG export)
```

# 2nd Break-through, using GIT

- forcing it to make a commit after each task allowed it to revert easier and to keep a better history of what it was doing. it also made it easier to keep track of changes to the skill and to the docs, and to make sure that the data was actually being used to update the docs and the skill.

# 3rd Break-through, PLAN.md and user input

- the PLAN.md structure allowed it to keep better track of where it was and what it was doing. but the prompt now allows the user to make it target, or re-target specific tasts. this is very useful to nudge it into certain directions.

# New let-down, output handling

- it tries to do JSON.stringify on the execute() output, which is a problem because it may contain circular references, or the data may be too large. we need something better.
