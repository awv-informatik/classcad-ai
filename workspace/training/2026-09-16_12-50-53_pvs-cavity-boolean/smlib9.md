# SMLib 9 quick comparison

The normal ClassCAD configuration selects SMLib 8.12. The switch lives in `/Users/dev/dev/awv/classcad/.classcad.ini`, section `[smlib]`: active lines 26-27 select the 8 services; commented lines 28-29 select `SMLibService_9.x`, `SMLibExpressService_9.x`, and `BrepSimplificationService_9.x` (plus debug counterparts). Enable the matching set, not both sets.

Version 9 is the separate `runtime/deps/smlib-sm` submodule, Azure repository `smlib-github-copy`, remote branch `awv`. Local pinned commit and verified remote awv tip are `3948a9ec9c1353f2c3dc0f0742fd5b64785e7709` (Improved SMLib 9.4.3). It also uses `runtime/deps/hwlib-sm`.

Building requires `CLASSCAD_BUILD_SMLIB_9_X=ON` and `CLASSCAD_BUILD_SMLIB_9_X_SERVICES=ON`; the normal macOS preset has both OFF. Service selection in the INI alone is insufficient without built libraries.

An isolated build was configured in `/tmp/pvs-smlib9-build`, libraries in `/tmp/pvs-smlib9-bin/Release`, reusing existing vcpkg dependencies. Built the three 9.x service targets. Loaded them through `worker-smlib9.ini` and DYLD_LIBRARY_PATH; startup log explicitly confirms libSMLibService_9.x.dylib loaded. No default INI, kernel-9 source, skill, or normal worker configuration changed.

The original reduced cavity construction was replayed with emission suppressed, three fresh workers: trials 21/22/23 all completed, approximately 3.18/3.21/3.40 seconds. Result artifacts and logs are in files/, summarized in files/smlib9-comparison.json. The hang/crash was NOT reproduced in these three SMLib 9.4.3 trials. This is not an exhaustive kernel or full housing validation.

Source caution: SmProtoTopology.cpp:7088 explicitly asserts the single coincident-face assumption needs rewriting for multiple faces. Lines 7094-7112 still update only the first face and break; lines 7434-7439 attach replacement edges to only that face. The old structural defect pattern remains in source, even though this exact reduced construction passes on 9. Do not claim a general fix or port the 8 patch blindly; deeper ownership instrumentation in 9 would be required to establish whether this test still visits that stale-reference path.
