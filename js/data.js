const ALL_AIRCRAFT = {
  cessna172ikl: {
    name: 'Cessna 172 I/K/L',
    label: 'Cessna 172 I/K/L',
    variant: 'Skyhawk',
    engine: 'Lycoming O-320 · 150 HP',
    speeds: { vr: 52, vx: 59, vy: 71, vfe: 87, approach: 70, shortFinal: 61, bestGlide: 65, bestGlideGross: 70, vs0: 43, vs: 50, va: 99, vno: 122, vne: 151 },
    checklists: {
  preflight: {
    label: 'Preflight',
    items: [
      { action: 'Hobbs / Tach', value: 'CHECK', note: 'Record times for billing and maintenance tracking', why: 'Hobbs tracks engine time for billing and maintenance intervals. Tach records RPM-weighted time used for engine overhaul scheduling. Checking them before and after flight lets you log accurate times and catch discrepancies.', tip: 'Write it down immediately — don\'t trust memory after a flight.', zone: 'sixpack',
        checks: [
          { text: 'Record current Hobbs time — establishes the baseline for billing and logbook accuracy', correct: true },
          { text: 'Record current Tach time — tracks RPM-weighted hours for maintenance intervals', correct: true },
          { text: 'Verify both meters read identically — a mismatch flags a prop governor fault', correct: false },
          { text: 'Note whether Hobbs advanced since the last entry — confirms the engine actually ran', correct: false },
        ] },
      { action: 'Fuel Quantity', value: 'CHECK VISUALLY', note: 'Always visually confirm — gauges can be inaccurate', why: 'Fuel gauges in GA aircraft are notoriously unreliable and are only required to be accurate at empty. A visual check through the fuel cap is the only way to know how much fuel you actually have. Countless accidents trace back to trusting gauges alone.', tip: 'Acronym: CIGAR — Controls, Instruments, Gas, Attitude, Runup. Gas = visual fuel check.', tipType: 'acronym', acronym: 'CIGAR', acronymDef: 'Controls · Instruments · Gas (visual) · Attitude · Runup — a classic preflight flow many pilots use', zone: 'oil',
        checks: [
          { text: 'Sufficient fuel for the planned route plus required reserves — confirmed visually, not from gauges', correct: true },
          { text: 'Actual level seen directly through the filler neck — not relying on cockpit gauges', correct: true },
          { text: 'Cockpit gauge reading matches the visual level', correct: false },
          { text: 'Both tanks are within 5 gallons of each other to prevent handling problems', correct: false },
        ] },
      { action: 'Fuel Caps', value: 'SECURE & VENTED', note: 'Both caps tight; ensure vents face forward', why: 'An unsecured fuel cap can allow fuel to siphon out in flight, especially at cruise. Caps must also be vented (a small hole) so air replaces fuel drawn to the engine — a blocked vent causes fuel starvation.', tip: 'After reinstalling: give the cap a firm twist, then tug up. If it moves, it\'s not locked.', zone: 'oil',
        checks: [
          { text: 'Each cap is fully seated and locked — won\'t pull free when tugged', correct: true },
          { text: 'Vent holes are open and unobstructed — a blocked vent starves the engine', correct: true },
          { text: 'Vent holes face forward into the slipstream for proper ram-air pressurization', correct: false },
          { text: 'Caps are installed on the correct tank (left vs. right) to prevent cross-flow', correct: false },
        ] },
      { action: 'Fuel Sump (each)', value: 'DRAIN & CHECK', note: 'Check for water (cloudy/bubbles) and correct color (blue/100LL)', why: 'Water is denser than aviation fuel and sinks to the lowest points (sumps). Even small amounts of water can cause engine stoppage. You drain a small sample from each sump drain and look for cloudiness, separation, or bubbles — all signs of water contamination.', tip: '100LL fuel is dyed BLUE. If your sample looks clear, purple, or wrong — don\'t fly.', zone: 'oil',
        checks: [
          { text: 'No water contamination — sample is clear, not cloudy, no bubbles or visible water layer', correct: true },
          { text: 'Correct fuel color — blue confirms 100LL avgas, not jet fuel or a misfuel', correct: true },
          { text: 'Volume is adequate — drain at least one full cup to reach any settled contamination', correct: false },
          { text: 'Unusual smell is sufficient grounds to abort the flight, even without visible contamination', correct: false },
        ] },
      { action: 'Oil Quantity', value: 'MIN 6 QTS', note: 'Check with dipstick; add if below 6 quarts', why: 'Oil lubricates, cools, and seals the engine. The C172 holds 8 quarts maximum. Below 6 quarts, oil temperature rises faster and the engine risks damage on longer flights. Always check with a dipstick — sight glasses can be misleading.', tip: 'Touch the dipstick to the back of your hand — if it\'s cold, the engine hasn\'t run. If warm, wait 5 min for accurate reading.', zone: 'oil',
        checks: [
          { text: 'Dipstick reads at least 6 quarts — the C172 minimum for safe operations', correct: true },
          { text: 'Oil appears normal — milky color means water contamination, very black means overdue for change', correct: true },
          { text: 'Level matches the squawk book entry from the last flight', correct: false },
          { text: 'Both dipstick insertions read the same level as a consistency verification', correct: false },
        ] },
      { action: 'Oil Cap', value: 'SECURE', note: 'Hand-tight and locked', why: 'An open or loose oil cap sprays hot oil over the engine and windshield within seconds of startup. This has caused complete loss of visibility and engine damage in accidents.', tip: 'After every oil check, say out loud: "Cap is on and locked." The verbalization catches the step when distracted.', zone: 'oil',
        checks: [
          { text: 'Cap is fully seated and won\'t pull free when tugged', correct: true },
          { text: 'No fresh oil spray or residue around the cap — would indicate it was loose in a previous flight', correct: true },
          { text: 'Cap alignment mark points to the 12 o\'clock index position', correct: false },
          { text: 'Cap gasket condition is assessed visually without tools', correct: false },
        ] },
      { action: 'Pitot Tube', value: 'UNOBSTRUCTED', note: 'Check for insects, debris, cover removed', why: 'The pitot tube measures dynamic air pressure to drive the airspeed indicator. Blockage — often from insects or a forgotten cover — gives false airspeed readings. Pilots have died flying with a blocked pitot thinking they were too slow.', tip: 'Pitot covers are usually red or orange with a "Remove Before Flight" streamer. If you installed it, YOU remove it.', zone: 'pitot',
        checks: [
          { text: 'Tube opening is clear — no insects, mud, or debris blocking it', correct: true },
          { text: 'Pitot cover has been removed and is stowed or returned', correct: true },
          { text: 'Heating element is visible and intact inside the tube opening', correct: false },
          { text: 'Tube is pointed slightly downward to allow moisture drainage', correct: false },
        ] },
      { action: 'Static Ports', value: 'CLEAR', note: 'Both sides of fuselage; critical for altimeter accuracy', why: 'Static ports measure ambient air pressure for the altimeter, VSI, and airspeed indicator. A blocked static port freezes the altimeter at the altitude where it blocked and makes VSI read zero. Run your finger along both ports — look for tape, bugs, or mud.', tip: 'Static ports are usually flush holes on both sides of the fuselage mid-section. They\'re easy to miss — deliberately run your fingers over them.', zone: 'static',
        checks: [
          { text: 'Both ports are clear — run a fingertip over each to feel for tape, mud, or insect blockage', correct: true },
          { text: 'Both sides of the fuselage are checked — there is one port per side', correct: true },
          { text: 'Ports are aimed perpendicular to the slipstream for accurate static pressure readings', correct: false },
          { text: 'Static port covers have been removed (most aircraft don\'t use removable covers)', correct: false },
        ] },
      { action: 'Control Surfaces', value: 'FREE & CORRECT', note: 'Push/pull each; check for full range, no binding', why: 'You\'re verifying that all flight controls move freely to full deflection AND move in the correct direction. Reversed controls (from improper rigging or maintenance) have caused fatal accidents. You should also feel for any unusual resistance or binding.', tip: 'Move the yoke right — look for right aileron UP, left aileron DOWN. Verify visually, not just by feel.', zone: 'controls',
        checks: [
          { text: 'Controls move freely to full deflection in all directions with no binding or unusual resistance', correct: true },
          { text: 'Controls move in the correct direction — right yoke produces right aileron UP', correct: true },
          { text: 'Control cable routing is verified under the engine cowling', correct: false },
          { text: 'Trim tabs are in the neutral position before setting takeoff trim', correct: false },
        ] },
      { action: 'Tires', value: 'CONDITION & INFLATION', note: 'Check for flat spots, cuts, proper inflation', why: 'Underinflated or damaged tires can fail on landing or cause ground handling problems, especially in crosswinds. Flat spots indicate hard braking. Check all three tires including the nosewheel.', tip: 'Press your thumb into the tire sidewall — proper inflation should feel firm. Any visible cord or deep cuts: do not fly.', zone: 'tires',
        checks: [
          { text: 'Proper inflation — tire sidewall feels firm under thumb pressure, not soft', correct: true },
          { text: 'No flat spots on the tread, which indicate hard braking in a previous landing', correct: true },
          { text: 'No exposed cord, deep cuts, or large gouges in the rubber', correct: true },
          { text: 'Tread depth meets the minimum legal requirement (like automobile tire laws)', correct: false },
          { text: 'Tire pressure matches the exact PSI value stamped on the sidewall', correct: false },
        ] },
      { action: 'Brakes', value: 'CHECK', note: 'Look for fluid leaks on struts and brake lines', why: 'Brake fluid leaks can cause brake failure on landing. Look for wet spots or staining around the brake calipers and brake lines. You\'ll also check brake function during taxi.', tip: 'Red or brown fluid on the wheel fairing or strut = brake fluid. Hydraulic brake fluid is a show-stopper.', zone: 'tires',
        checks: [
          { text: 'No red or brown hydraulic fluid visible on calipers, brake lines, or wheel fairings', correct: true },
          { text: 'Brake hoses and lines show no cracking, chafing, or fraying', correct: true },
          { text: 'Brake pad thickness is adequate — visible from the outside without disassembly', correct: false },
          { text: 'Brake fluid reservoir is at the correct level (C172 uses a sealed hydraulic system)', correct: false },
        ] },
      { action: 'Tie-downs / Chocks', value: 'REMOVED', note: 'Both tie-down ropes and any wheel chocks', why: 'Attempting to taxi or take off with tie-downs attached can cause structural damage or flip the aircraft. This is embarrassingly common — even experienced pilots have done it. Chocks left in place prevent taxi.', tip: 'Walk completely around the aircraft during your preflight. You\'ll naturally see tie-downs if they\'re still on. Never skip the walk-around.', zone: 'tires',
        checks: [
          { text: 'Both wing tie-down ropes are removed and stowed', correct: true },
          { text: 'All wheel chocks are removed from all three wheels', correct: true },
          { text: 'Tie-down cleats on the ramp are properly rated for the aircraft\'s maximum gross weight', correct: false },
          { text: 'Tie-down ropes are inspected for fraying before being stored away', correct: false },
        ] },
    ]
  },
  beforestart: {
    label: 'Before Start',
    items: [
      { action: 'Preflight Inspection', value: 'COMPLETE', note: 'Confirm walk-around is done', why: 'A verbal confirmation that you\'ve completed the exterior walk-around. It\'s easy to get distracted and sit down before finishing — this step forces a conscious check.',
        answerVariants: [
          'A verbal confirmation forces a conscious check — it\'s easy to get distracted and sit down before finishing the walk-around.',
          'Without this step you might skip the last few items of the walk-around without realizing it.',
          'This is a deliberate mental gate confirming you completed the full exterior inspection, not just most of it.',
        ],
        distractors: [
          'Logging the preflight is required by insurance before the engine is started.',
          'The preflight must be confirmed complete before ATC will issue taxi clearance.',
          'Recording completion time syncs the Hobbs meter to the maintenance log.',
          'The walk-around must be signed off in the aircraft logbook before each departure.',
          'Confirming the preflight resets the aircraft\'s maintenance fault counter for the flight.',
        ],
        tip: 'If you can\'t remember completing a specific preflight item, go back and check it. Memory is not a substitute for action.', zone: 'tires' },
      { action: 'Hobbs/Tach', value: 'NOTE TIME', note: 'Start time logged', why: 'Logging your start Hobbs time lets you compute accurate flight time for billing, logbook, and maintenance tracking.',
        answerVariants: [
          'Logging your start Hobbs time lets you compute accurate flight time for billing, logbook, and maintenance tracking.',
          'Without a start reading you can\'t calculate billable hours, log accurate flight time, or schedule maintenance correctly.',
          'The Hobbs tracks engine time for overhaul intervals and billing — you need the start value to compute elapsed time.',
        ],
        distractors: [
          'Confirming the engine hasn\'t exceeded its TBO limit before this flight.',
          'Required by FAR 91.409 to be recorded before each departure.',
          'Verifying fuel burn from the previous flight matches the aircraft\'s fuel log.',
          'The Hobbs must be noted so ATC can verify the aircraft\'s maintenance currency.',
          'Cross-checking Hobbs and Tach ensures the prop governor is calibrated correctly.',
        ],
        tip: 'Take a photo of the Hobbs/Tach with your phone before engine start. Quick, accurate, and searchable later.', zone: 'sixpack' },
      { action: 'Seats & Belts', value: 'ADJUST & LOCK', note: 'Both occupants; seat rails locked', why: 'Seats that aren\'t properly locked on their rails can slide back on takeoff rotation, making it impossible to reach the controls. This has caused accidents on takeoff. The loud click means it\'s locked.',
        answerVariants: [
          'Seats that aren\'t locked can slide back on takeoff rotation, making it impossible to reach the controls.',
          'An unlocked seat rail can cause the seat to shoot rearward under G-load at rotation — you won\'t be able to reach the yoke.',
          'The loud click means the rail is locked; without it the seat can slip back at the worst possible moment.',
        ],
        distractors: [
          'Seat position must be confirmed before requesting taxi clearance from ground.',
          'Prevents the seat from obstructing rudder pedal travel during ground operations.',
          'Shoulder harness adjustment is required for the weight and balance calculation.',
          'Belts must be checked to ensure the ELT harness connector is not obstructed.',
          'Required by FAR 91.107 to be verified before the aircraft moves under its own power.',
        ],
        tip: 'After adjusting: grab the seat back and try to push it rearward forcefully. No movement = locked.', zone: 'seats' },
      { action: 'Brakes', value: 'TEST & SET', note: 'Press firmly; hold during start', why: 'You verify brake function before you have engine power. Holding brakes during start keeps the aircraft stationary while the prop wash is generating significant force. Release brakes before advancing throttle for taxi.',
        answerVariants: [
          'You verify brake function before you have engine power, and hold brakes to keep the aircraft stationary during start.',
          'Holding brakes during start keeps the aircraft from rolling while the propeller generates significant thrust.',
          'Testing confirms brake function before taxi — you want to know about a brake problem before you need it at speed.',
        ],
        distractors: [
          'Brake fluid thins when cold and must be pressurized before the hydraulic system works properly.',
          'The brake test confirms parking brake pressure is adequate before setting for runup.',
          'Testing brakes clears air from the lines that may have built up since the last flight.',
          'Required by FAR 91.409 to be recorded before each departure.',
          'Brake pressure must be verified before the nose wheel steering can be engaged.',
        ],
        seqQuestion: 'Why test the brakes before you start the engine?', tip: 'Press and hold both toe brakes — they should feel firm with no spongy travel. Spongy = air in the lines.', zone: 'tires' },
      { action: 'Circuit Breakers', value: 'IN (CHECK)', note: 'All breakers in and set', why: 'A popped circuit breaker means that circuit is unprotected or non-functional. If a breaker is out before start, you have an electrical issue that needs to be resolved before flight.',
        answerVariants: [
          'A popped circuit breaker means that circuit is unprotected or non-functional — an electrical issue to resolve before flight.',
          'If a breaker is out before start, the system it protects isn\'t working and you may not notice until it matters.',
          'Breakers out before start indicate an existing fault — flying with unknown electrical faults is dangerous.',
        ],
        distractors: [
          'Circuit breakers must all be in for the master switch to power the electrical bus.',
          'A tripped breaker causes the alternator to produce excess voltage that can damage the battery.',
          'Breakers are checked to confirm the avionics cooling fan is operating before power-up.',
          'Electrical equipment must be off to allow the alternator to complete its self-test sequence.',
          'A popped breaker prevents the ignition switch from completing the start circuit.',
        ],
        tip: 'Run your eyes along the CB panel left to right. Any breaker sticking out further than the rest is popped.', zone: 'cb' },
      { action: 'Electrical Equipment', value: 'OFF', note: 'Reduce electrical load during start', why: 'The starter motor draws enormous current. Additional electrical loads during start can cause voltage spikes that damage avionics or drain the battery, making start more difficult. Turn everything off, then add load after start.',
        answerVariants: [
          'The starter motor draws enormous current — extra loads cause voltage spikes that damage avionics or drain the battery.',
          'Extra electrical load during start competes with the starter and risks a surge that damages sensitive electronics.',
          'Turn everything off so the starter has full battery current, then add load after the engine is running.',
        ],
        distractors: [
          'Electrical equipment must be off to allow the alternator to complete its self-test sequence.',
          'Lights and radios on during start interfere with the magneto firing sequence.',
          'Electrical load during start can cause the fuel pump to draw insufficient pressure.',
          'The master switch won\'t engage if electrical equipment is drawing current at start.',
          'Running equipment during start drains the battery enough to affect magneto timing.',
        ],
        seqQuestion: 'Why turn electrical equipment off before starting the engine?', tip: 'Think of it like starting a car in winter — you turn off A/C and heated seats first.', zone: 'master' },
      { action: 'Avionics Master', value: 'OFF', note: 'Protect avionics from start surge', why: 'Engine start creates a momentary voltage spike that can damage sensitive avionics — GPS units, radios, and glass panels are vulnerable. The avionics master isolates them during this surge. Turn it on after the engine is running and stable.',
        answerVariants: [
          'Engine start creates a voltage spike that can damage GPS units, radios, and glass panels — the avionics master isolates them.',
          'The avionics master shields sensitive electronics from the start surge; turn it on after the engine is running.',
          'GPS units, radios, and displays are all vulnerable to the start surge — this switch exists specifically to protect them.',
        ],
        distractors: [
          'Avionics must be off during start so the GPS can acquire satellites on a cold boot.',
          'The avionics bus cannot share power with the starter motor or the master switch won\'t engage.',
          'Avionics must initialize from a cold state after every engine start to clear cached flight data.',
          'The avionics master must be off to prevent the COM radio from transmitting during engine start.',
          'Avionics draw too much current for the battery alone and must be isolated until the alternator is online.',
        ],
        seqQuestion: 'Why turn the Avionics Master off before starting the engine?', tip: 'The avionics master is separate from the main electrical master. It\'s usually a toggle above or near the radio stack. "Avionics on LAST before taxi, off FIRST before shutdown."', zone: 'avionics' },
      { action: 'Fuel Selector', value: 'BOTH', note: 'Ensures both tanks feed engine during start', why: 'BOTH position draws from both tanks simultaneously, ensuring adequate fuel flow. Starting on a single tank risks fuel starvation if that tank is lower than expected or has a problem.',
        answerVariants: [
          'BOTH draws from both tanks simultaneously — starting on one tank risks starvation if it\'s lower than expected.',
          'Starting on a single tank risks fuel starvation if that tank has a problem or is lower than you thought.',
          'BOTH ensures redundant fuel supply for start and takeoff — you want maximum fuel availability at the critical moment.',
        ],
        distractors: [
          'BOTH position is required so the fuel flow gauge reads accurately before start.',
          'FAA regulations prohibit single-tank operation during engine start and shutdown.',
          'BOTH position pressurizes both fuel lines equally to prevent vapor lock on hot days.',
          'The fuel selector must be on BOTH for the electric boost pump to function correctly.',
          'Single-tank operation is only permitted above 3,000 feet AGL per the POH.',
        ],
        seqQuestion: 'Why set the fuel selector to BOTH before starting?', tip: 'Reach down and physically move the selector to BOTH — then look at it. Don\'t just reach and assume.', zone: 'fuel' },
    ]
  },
  start: {
    label: 'Engine Start',
    items: [
      { action: 'Beacon', value: 'ON', note: 'Alert others you are about to start',
        why: 'The rotating beacon is the universal signal that the engine is running or about to start. Ground crew, linemen, and other pilots will see it and stay clear of the propeller arc. It must be on before you engage the starter.',
        answerVariants: [
          'The rotating beacon signals the engine is about to start — ground crew and pilots will see it and stay clear of the prop.',
          'The beacon is the universal warning to stay clear of the prop arc; it must be on before you touch the starter.',
          'Ground crew and other pilots use the beacon to know the prop is about to spin — no beacon, no warning.',
        ],
        seqQuestion: 'Why turn the beacon on before starting the engine?',
        distractors: [
          'ATC requires the beacon on before they will issue a clearance to taxi.',
          'The beacon must be on to power the annunciator panel for engine start.',
          'The beacon warms up the electrical bus to its operating voltage before start.',
          'Other aircraft use your beacon to identify your position in the runup area.',
          'FAA regulations require the beacon on whenever the aircraft is being refueled.',
        ],
        tip: 'Beacon = engine running. It\'s the first thing on before start, last thing off after shutdown.', zone: 'beacon' },
      { action: 'Throttle', value: '1/4–1/2 INCH OPEN', note: 'Slightly open for start',
        why: 'A fully closed throttle can make the engine difficult to start and prone to loading up. A slightly open throttle provides the right fuel/air mix for initial combustion. Too much throttle and the engine may race uncontrollably after starting.',
        answerVariants: [
          'A fully closed throttle makes the engine hard to start and prone to loading up; slightly open provides the right mix for combustion.',
          'Too little throttle and the engine loads up; too much and it races after start — slightly open is the sweet spot.',
          'The slightly open throttle gives the carburetor the airflow it needs to form a combustible mixture on the first few turns.',
        ],
        distractors: [
          'Full throttle is needed briefly during start to generate enough compression for ignition.',
          'The throttle must be set precisely before start or the mixture will be too lean to ignite.',
          'A closed throttle starves the carburetor of air and prevents the primer fuel from vaporizing.',
          'The throttle position determines starter engagement speed; incorrect position delays crank.',
          'Throttle cracked open prevents the choke from activating and flooding the engine.',
        ],
        tip: 'About the width of two fingers pushed in from fully closed. You\'ll develop a feel for it.', zone: 'throttle' },
      { action: 'Mixture', value: 'RICH', note: 'Full rich for sea level; lean as needed at altitude',
        why: 'Rich mixture provides maximum fuel for start. Carbureted engines like the C172 need a rich mixture for cold starts. At higher density altitudes (mountains, hot days) you\'ll lean slightly even for start — but full rich at sea level is standard.',
        answerVariants: [
          'Rich mixture provides maximum fuel for start — carbureted engines need it for cold starts at sea level.',
          'Full rich ensures enough fuel to fire on a cold engine; lean only at high density altitude where full rich causes rough running.',
          'The engine needs maximum fuel to fire when cold — full rich gives it that; lean adjustment only needed at high elevation.',
        ],
        distractors: [
          'Rich mixture cools the cylinders during start to prevent overheating on initial power application.',
          'Rich mixture is required to pressurize the fuel lines before the fuel pump reaches operating pressure.',
          'Full rich opens the throttle butterfly to maximum airflow for the starter motor.',
          'Rich mixture at start lubricates the cylinder walls before oil pressure builds.',
          'The mixture must be rich so the EGT stabilizes quickly during the first few seconds of operation.',
        ],
        tip: 'Red knob, full IN = rich. Remember: red = fuel (rich). You lean it OUT to reduce fuel.', zone: 'mixture' },
      { action: 'Carb Heat', value: 'COLD', note: 'Off during start — only use in flight if icing suspected',
        why: 'Carb heat on during start reduces engine power and can disrupt the fuel/air mixture needed for starting. It also bypasses the air filter, allowing unfiltered air into the engine. Off for start — on in flight if you suspect carb ice.',
        answerVariants: [
          'Carb heat on during start reduces power and bypasses the air filter, letting unfiltered air into the engine.',
          'Carb heat disrupts the fuel/air mix needed for starting and removes the air filter from the circuit.',
          'Cold during start because warm air reduces density and bypasses filtration — carb heat is only for suspected ice in flight.',
        ],
        seqQuestion: 'Why keep carb heat cold during engine start?',
        distractors: [
          'Carb heat must be cold during start to allow the choke to function correctly.',
          'Hot air from carb heat can cause a backfire during start when the mixture is full rich.',
          'Carb heat on during start causes the magnetos to fire out of sequence.',
          'Warm air from carb heat causes the fuel to vaporize too quickly before ignition.',
          'Carb heat bypass valve must be cold for the primer injectors to function correctly.',
        ],
        tip: 'Carb heat = warm unfiltered air. Only useful when you suspect ice. On the ground = off.', zone: 'carbheat' },
      { action: 'Prime (if cold)', value: '2–6 STROKES', note: 'Warm engine needs less; don\'t over-prime',
        why: 'The primer injects raw fuel directly into the intake manifold, making cold starts easier when fuel vaporization is poor. Over-priming floods the engine with excess fuel, making start very difficult. Warm engines need zero priming.',
        answerVariants: [
          'The primer injects raw fuel into the intake manifold to help cold starts when fuel vaporization is poor.',
          'Cold engines need priming because fuel doesn\'t vaporize well at low temperature — over-priming floods the engine.',
          'Priming compensates for poor cold-weather fuel vaporization; too many strokes makes start nearly impossible.',
        ],
        distractors: [
          'Priming pressurizes the fuel system to ensure the carburetor float valve is properly seated.',
          'The primer must be used to bring fuel up to the carburetor after it drains on long sits.',
          'Priming lubricates the throttle shaft before the first start of the day.',
          'The primer is used to clear vapor lock from the fuel lines before engaging the starter.',
          'Priming is required to activate the electric fuel pump on carbureted engines during cold starts.',
        ],
        tip: 'Rule of thumb: cold outside = more primes. Warm engine or hot day = none. If it\'s flooded, mixture to idle-cutoff, throttle full open, crank to clear it.', zone: 'primer' },
      { action: 'Primer', value: 'IN & LOCKED', note: 'Must be locked in before start',
        why: 'An unlocked primer allows air to bypass the carburetor, causing a lean stumble or rough running. Engine vibration can also cause an unlocked primer to work itself in or out, creating unpredictable fuel flow.',
        answerVariants: [
          'An unlocked primer allows air to bypass the carburetor, causing a lean stumble or rough running.',
          'Engine vibration can work an unlocked primer in or out, creating unpredictable fuel flow.',
          'The primer must be locked or it acts as an air leak — lean mixture and rough engine operation result.',
        ],
        distractors: [
          'An unlocked primer can contact the throttle linkage and restrict movement during runup.',
          'The primer must be locked to prevent raw fuel from dripping into the intake on hot days.',
          'Primer lock prevents fuel pressure from forcing the primer out under high manifold pressure.',
          'An unlocked primer can snag on the yoke, causing inadvertent fuel injection mid-flight.',
          'The primer must be locked so the fuel flow gauge reads accurately during start.',
        ],
        tip: 'Push IN fully, then twist clockwise to lock. You should feel a positive stop. Tug it — it should not come out.', zone: 'primer' },
      { action: 'Propeller Area', value: 'CLEAR', note: 'Call "CLEAR PROP" audibly before engaging starter',
        why: 'The propeller is invisible when spinning. Anyone near the prop arc when the engine starts will be seriously injured or killed. You call "CLEAR PROP" out loud and check visually before touching the starter.',
        answerVariants: [
          'The propeller is invisible when spinning — anyone near the arc at start will be seriously injured or killed.',
          'You call CLEAR PROP and look because the spinning prop is invisible and instantly lethal to anyone nearby.',
          'A spinning propeller cannot be seen — the verbal call and visual check are the only protection for people near the aircraft.',
        ],
        seqQuestion: 'Why call "Clear Prop" before engaging the starter?',
        distractors: [
          'The call is required by ATC at uncontrolled fields before engine start.',
          'CLEAR PROP activates the ramp warning lights to alert ground crew.',
          'You call CLEAR PROP so the tower can note the start time for your departure sequence.',
          'The call is a signal for passengers to cover their ears before engine noise begins.',
          'Required so nearby aircraft crews know you\'re starting and can hold position.',
        ],
        tip: 'Open the window, lean out, look both ways, then call it. Don\'t call it just to hear yourself — actually look.', zone: 'oil' },
      { action: 'Master Switch', value: 'ON', note: 'Both ALT and BAT switches',
        why: 'The master switch has two halves: BAT (battery) powers the electrical system, ALT (alternator) connects the alternator to the bus. Both must be on. Some pilots turn BAT on first to confirm voltage before connecting the alternator.',
        answerVariants: [
          'The master has two halves — BAT powers the electrical system, ALT connects the alternator. Both must be on.',
          'BAT powers the electrical bus; ALT connects the alternator. You need both on before the starter will work.',
          'Turn BAT on first to confirm voltage, then ALT to connect the charging system — both required for start.',
        ],
        seqQuestion: 'Why turn the Master Switch on before engaging the starter?',
        distractors: [
          'The master switch enables the primer circuit — priming won\'t work without BAT on.',
          'BAT switch powers the fuel pump; without it the carburetor bowl won\'t fill before start.',
          'ALT switch must be on before start so the alternator self-test can complete.',
          'Both switches must be on to allow the magnetos to receive the starter signal.',
          'The master switch arms the ignition circuit — starter won\'t engage without it.',
        ],
        tip: 'It\'s a split rocker — left side ALT, right side BAT. Flip both up together for ON.', zone: 'master' },
      { action: 'Ignition', value: 'START', note: 'Release when engine catches; don\'t crank more than 10s',
        why: 'The ignition switch has positions: OFF, R, L, BOTH, START. START engages the starter motor. Release to BOTH as soon as the engine catches — running the starter on a live engine damages it. Never crank more than 10 seconds without a 30-second rest.',
        answerVariants: [
          'Release to BOTH the moment the engine catches — running the starter on a live engine damages it.',
          'START engages the starter motor; release immediately when the engine fires to avoid starter damage.',
          'The starter can\'t run continuously — release to BOTH when the engine catches, never crank more than 10 seconds.',
        ],
        distractors: [
          'Holding START too long floods the engine with fuel from the primer circuit.',
          'The ignition switch must be released to BOTH so the avionics can initialize before taxi.',
          'Holding START beyond engine fire can cause the alternator to over-spin and fail.',
          'Continuous cranking at over 10 seconds can overheat the magneto points.',
          'The ignition must return to BOTH so the fuel pump can take over from the starter solenoid.',
        ],
        tip: 'Your hand should be spring-loaded to release. The moment you hear the engine catch, let go.', zone: 'ignition' },
      { action: 'Oil Pressure', value: 'CHECK (30s)', note: 'Should show pressure within 30 seconds — abort if not',
        why: 'Oil pressure rising confirms that oil is circulating before heat and friction build up. No pressure within 30 seconds means the oil pump may have failed or oil is severely low — continuing risks catastrophic engine damage within minutes.',
        answerVariants: [
          'Oil pressure rising confirms oil is circulating before heat and friction build up — no pressure in 30s means shut down.',
          'If oil pressure doesn\'t show within 30 seconds, the oil pump may have failed — continuing destroys the engine in minutes.',
          'Metal-on-metal damage happens fast without lubrication — this is the first check after start because time matters.',
        ],
        seqQuestion: 'Why check oil pressure immediately after starting the engine?',
        distractors: [
          'Oil pressure check confirms the fuel flow is adequate to prevent the engine from running lean after start.',
          'The oil pressure gauge must read before you can advance throttle for taxi per the POH.',
          'Oil pressure confirms the vacuum pump is operating, which powers the attitude and heading indicators.',
          'Checking oil pressure at 30 seconds confirms the oil filter hasn\'t bypassed since the last change.',
          'Oil pressure must be confirmed before the alternator can come online and begin charging.',
        ],
        tip: 'Watch the gauge immediately after start. Green arc = good. No movement after 30s = shut down immediately.', zone: 'sixpack' },
    ]
  },
  runup: {
    label: 'Runup',
    items: [
      { action: 'Engine Warm-up', value: '1000 RPM', note: 'Allow oil temp to come up before runup',
        why: 'Cold oil is thick and doesn\'t lubricate as effectively. Running the engine at idle until oil temperature rises protects engine internals during the high-power runup checks. Rushing this on cold days stresses the engine.',
        answerVariants: [
          'Cold oil is thick and doesn\'t lubricate well — warming up protects engine internals before the high-power runup checks.',
          'Running at low RPM until oil temp rises ensures oil can flow properly through bearings and passages.',
          'You\'re waiting for oil to reach operating temperature so it can protect the engine during the more demanding runup.',
        ],
        distractors: [
          'The warm-up period allows the fuel system to pressurize fully before you advance the throttle.',
          'Idling for several minutes clears any residual primer fuel from the intake manifold.',
          'Engine warm-up is required to let the magneto points reach operating temperature before the mag check.',
          'Low RPM warm-up burns off water condensation in the fuel lines from overnight sitting.',
          'Warm-up at 1000 RPM allows the vacuum pump to build suction before you check the gyros.',
        ],
        tip: 'Many pilots target 1000 RPM and wait for the oil temp needle to show movement. On cold days this can take several minutes.', zone: 'sixpack' },
      { action: 'Throttle', value: '1800 RPM', note: 'Set for runup checks',
        why: '1800 RPM is high enough to load the engine for meaningful magneto and carb heat checks, but low enough to not stress the airframe or blow the aircraft around on the ramp. This is the standard runup power setting for the C172.',
        answerVariants: [
          '1800 RPM loads the engine enough for meaningful magneto and carb heat checks without stressing the airframe.',
          'The mag check needs enough load to reveal ignition problems — 1800 RPM provides that without blowing the aircraft around.',
          'At 1800 RPM the engine is loaded enough that a weak magneto or fouled plug shows a measurable RPM drop.',
        ],
        seqQuestion: 'Why run the engine at 1800 RPM for magneto checks instead of at idle?',
        distractors: [
          'FAR 91.409 requires a full-power runup at 1800 RPM before each departure.',
          '1800 RPM is required for the carburetor to deliver fuel through the main jet, not just the idle circuit.',
          'The alternator can only complete its self-test and confirm charge at 1800 RPM or above.',
          'Gyroscopic instruments need engine-driven vacuum at 1800 RPM to reach operating speed before takeoff.',
          '1800 RPM creates enough prop wash to verify the elevator and rudder have full range of motion.',
        ],
        tip: 'Set it smoothly — slam-advancing the throttle can overstress cold engine parts.', zone: 'throttle' },
      { action: 'Magnetos', value: 'CHECK L/R', note: 'Max 125 RPM drop; max 50 RPM difference between mags',
        why: 'The C172 has two independent ignition systems (magnetos) so if one fails, the engine keeps running. You test each one by switching off the other and watching for RPM drop. A large drop means that magneto is doing too much work alone — possibly a fouled plug. Zero drop means the dead magneto is still firing (grounding problem).',
        answerVariants: [
          'The C172 has two independent ignition systems — you test each one alone to confirm both are functional before relying on them.',
          'Testing each magneto independently reveals a fouled plug or weak mag before takeoff when you still have options.',
          'A large RPM drop on one mag means that magneto is carrying too much load — a fouled plug the other mag was hiding.',
        ],
        seqQuestion: 'Why test one magneto at a time rather than just confirming both work together?',
        distractors: [
          'The magneto check confirms both spark plugs per cylinder are firing at the correct timing.',
          'Switching magnetos confirms the alternator is producing consistent voltage at high RPM.',
          'The mag check resets the ignition timing advance before applying full takeoff power.',
          'Magneto check confirms the ignition switch wiring is correct so you can safely use the OFF position.',
          'Testing each mag confirms neither one has burned out its points from the previous start cycle.',
        ],
        tip: 'Switch from BOTH → R → BOTH → L → BOTH. The pause at BOTH between checks lets RPM stabilize.', zone: 'ignition' },
      { action: 'Carb Heat', value: 'ON — CHECK', note: 'Expect slight RPM drop (carb heat normal); return to COLD',
        why: 'Carb heat sends warm unfiltered air through the carburetor to melt any ice. The warm air is less dense, causing a normal small RPM drop. If you had carb ice, the RPM will initially drop more (melting ice disrupts flow), then rise above original. Return to COLD before takeoff — carb heat on reduces power.',
        answerVariants: [
          'Warm air causes a normal RPM drop — but if RPM drops then rises above original, you had actual ice that melted.',
          'The carb heat check tests both the system function and detects any existing ice before you commit to takeoff.',
          'A drop-then-rise in RPM after applying carb heat is the good news: it means you caught and melted ice on the ground.',
        ],
        seqQuestion: 'Why check carb heat during runup and then return it to COLD before takeoff?',
        distractors: [
          'The carb heat check confirms the throttle butterfly is opening fully to its mechanical stop.',
          'Applying carb heat during runup purges the intake manifold of moisture before high-power operation.',
          'The carb heat check verifies the fuel flow gauge reads accurately at reduced engine power.',
          'You apply carb heat to verify the engine compartment temperature is adequate before takeoff.',
          'Carb heat check confirms the throttle heating element is connected and won\'t fail in flight.',
        ],
        tip: 'No RPM change at all when applying carb heat = possible icing already melted or control not working. Investigate.', zone: 'carbheat' },
      { action: 'Engine Instruments', value: 'GREEN', note: 'Oil temp, oil pressure, fuel flow all in range',
        why: 'All engine instruments should be in the green arc before applying takeoff power. Red lines and yellow arcs are limits. Takeoff with an instrument in the yellow or near red is asking for an in-flight emergency.',
        answerVariants: [
          'All engine instruments must be in the green arc before takeoff — amber or red means you\'re already in limit territory.',
          'Takeoff with an instrument in the yellow or near red risks an in-flight emergency at the worst possible time.',
          'Green across the board confirms the engine is healthy before you commit to the takeoff roll.',
        ],
        distractors: [
          'Green engine instruments confirm the autopilot has completed its self-test and is ready for use.',
          'Oil temperature in the green arc confirms the vacuum pump is operating at full suction.',
          'Green engine instruments confirm the fuel pump has brought both tanks up to equal pressure.',
          'Confirming green gauges resets the engine monitor\'s exceedance alert for the new flight.',
          'Engine instruments in the green confirm the transponder encoder is reading pressure altitude correctly.',
        ],
        tip: 'Green = go. Scan oil temp, oil pressure, ammeter, and fuel flow. If anything is amber or red, investigate before departing.', zone: 'sixpack' },
      { action: 'Throttle', value: 'IDLE CHECK', note: 'Confirm idle ~650 RPM; throttle smoothly to 1000',
        why: 'If idle RPM is too low, the engine may quit during landing rollout or taxi — a dangerous time to lose power. If too high, the aircraft may be difficult to slow on approach. Proper idle speed is 600-700 RPM.',
        answerVariants: [
          'Too-low idle RPM and the engine may quit during landing rollout — too high and you can\'t slow on approach.',
          'Proper idle speed ensures the engine stays running when you pull power on approach and landing rollout.',
          'Checking idle during runup finds the problem when you\'re stationary, not on final approach.',
        ],
        distractors: [
          'The idle check confirms there are no obstructions in the throttle cable that could prevent full-power application.',
          'Pulling to idle during runup confirms oil pressure won\'t drop below minimum at low power settings.',
          'Idle check is required by the C172 POH to confirm the idle mixture adjustment is within spec.',
          'The throttle idle check confirms the fuel selector won\'t be disturbed when power is reduced for landing.',
          'Pulling the throttle to idle flushes accumulated carbon from the exhaust system before takeoff.',
        ],
        tip: 'Pull throttle to idle, count to 3. Engine should stay running smoothly. Then come back up to ~1000 for taxi.', zone: 'throttle' },
      { action: 'Flight Controls', value: 'FREE & CORRECT', note: 'Full deflection in each direction; verify correct movement',
        why: 'This final cockpit check ensures no control locks were left in, nothing is obstructing movement, and the controls weren\'t accidentally reconnected incorrectly after maintenance. Full deflection means full — not 80%.',
        answerVariants: [
          'Final check confirms no control locks are in, nothing is obstructing movement, and no incorrect reconnection after maintenance.',
          'A stuck or reversed control on takeoff is unrecoverable — the runup check is your last chance before committing.',
          'Full deflection confirms the entire range of motion is available — partial travel near center can hide a blockage.',
        ],
        seqQuestion: 'Why check flight controls again during runup when you already checked them during preflight?',
        distractors: [
          'The control check at runup confirms the trim tabs are responding correctly to trim wheel inputs.',
          'You\'re verifying the elevator trim spring isn\'t opposing movement at full deflection.',
          'Full control deflection confirms the magnetic compass is not affected by control surface movement.',
          'Flight control check confirms the flap actuator won\'t interfere with aileron movement.',
          'Checking controls at runup ensures the gust lock hasn\'t been re-engaged by a ramp worker.',
        ],
        tip: 'Yoke full right: look back at RIGHT aileron UP. Full left: LEFT aileron UP. Full back: elevator UP. Full forward: elevator DOWN. Rudder left: left rudder deflects left.', zone: 'controls' },
      { action: 'Trim', value: 'SET TAKEOFF', note: 'Elevator trim to takeoff position mark',
        why: 'Takeoff trim reduces the control force needed to rotate at Vr. Wrong trim setting means you\'ll fight an unexpected pitch force at the worst moment — during takeoff roll. Most C172s have a green takeoff band on the trim indicator.',
        answerVariants: [
          'Correct takeoff trim reduces stick force at rotation — wrong trim means fighting unexpected pitch at the worst moment.',
          'The green takeoff band on the trim indicator is there for a reason — out-of-trim takeoff requires excessive yoke force at Vr.',
          'Trim wrong means either forcing the nose up or fighting a nose-up pitch surge at rotation — both are dangerous.',
        ],
        distractors: [
          'Trim set to takeoff confirms the elevator cable tension is within limits per the POH.',
          'The trim position must be noted for the weight and balance calculation before departure.',
          'Setting trim for takeoff confirms the trim wheel brake isn\'t slipping, which would allow trim creep.',
          'Takeoff trim position is required by ATC so they can compute your expected climb gradient.',
          'Trim set to takeoff confirms the stabilizer incidence is correct after any recent maintenance.',
        ],
        tip: 'The trim wheel is on the center console between the seats. Set it to the green takeoff range mark, then verify the trim tab position visually if you can.', zone: 'trim' },
      { action: 'Fuel Selector', value: 'BOTH', note: 'Confirm on BOTH',
        why: 'Confirming BOTH again before takeoff ensures you haven\'t inadvertently moved it during runup. Engine failure on takeoff due to fuel selector on a low or empty tank is a known accident cause.',
        answerVariants: [
          'Confirming BOTH a second time — it could have been bumped during runup, and a takeoff on a nearly-empty tank has killed pilots.',
          'The fuel selector is in a reachable position where it can be knocked during runup — a final check before committing is critical.',
          'Engine failure on takeoff due to the wrong tank is a known accident cause; this check costs two seconds and saves lives.',
        ],
        distractors: [
          'BOTH position is required for the fuel flow gauge to read accurately before you log the departure fuel.',
          'Fuel selector on BOTH must be confirmed before ATC will issue takeoff clearance at Class D airports.',
          'Setting BOTH equalizes pressure in both fuel lines to prevent vapor lock on hot days.',
          'The fuel selector must be confirmed on BOTH so the electric fuel pump can function correctly.',
          'Confirming BOTH position resets the fuel totalizer to track consumption from both tanks equally.',
        ],
        tip: 'Look at the selector handle direction — BOTH should point forward (toward the nose). Left or right = single tank.', zone: 'fuel' },
      { action: 'Mixture', value: 'RICH (or as required)', note: 'Rich at lower elevations; lean for high-density altitude',
        why: 'Full rich provides maximum power for takeoff at sea level. At high density altitude (hot day, high elevation), full rich actually causes the engine to run rough due to excess fuel — you lean slightly to restore smooth power.',
        answerVariants: [
          'Full rich gives maximum power for takeoff at sea level — at high density altitude it actually causes rough running.',
          'Sea level: full rich for max power. High elevation or hot day: lean slightly so the engine runs smoothly at full throttle.',
          'An overly rich mixture at high density altitude robs power exactly when you need all you can get on takeoff.',
        ],
        distractors: [
          'Rich mixture during takeoff ensures the EGT stays below redline during the initial climb.',
          'Mixture must be confirmed rich before takeoff for the CHT to stabilize within normal range.',
          'Full rich is required so the primer circuit can provide additional fuel during the initial power application.',
          'Mixture at rich confirms the carburetor accelerator pump is delivering fuel for the throttle advance.',
          'The mixture must match the POH chart setting for the alternator to produce rated current at full power.',
        ],
        tip: 'If your home field is below 3000 ft MSL: full rich for takeoff. Above that or on hot days: lean for smooth operation.', zone: 'mixture' },
      { action: 'Primer', value: 'IN & LOCKED', note: 'Confirm locked — vibration can unlatch it',
        why: 'Engine vibration during runup can shake loose a primer that wasn\'t fully locked. An unlocked primer during takeoff causes lean mixture and rough running at the critical moment of climb.',
        answerVariants: [
          'Engine vibration during runup can shake loose an improperly locked primer — causing lean mixture at the worst possible moment.',
          'An unlocked primer at takeoff power acts as an air leak, causing lean mixture and rough running during climb.',
          'Vibration during runup is exactly the force that can dislodge an unlocked primer — check it before you go.',
        ],
        distractors: [
          'An unlocked primer can contact the throttle quadrant and prevent full throttle application on takeoff.',
          'The primer must be confirmed locked for the fuel flow gauge to read accurately at full power.',
          'Primer locked is required before the magneto switch can be moved to the START position.',
          'An unlocked primer can interfere with the mixture control cable during full-power operation.',
          'Confirming primer locked verifies the intake manifold gasket hasn\'t been disturbed during maintenance.',
        ],
        tip: 'Tug the primer outward firmly. It should not move. If it comes out — it wasn\'t locked.', zone: 'primer' },
      { action: 'Avionics', value: 'ON & SET', note: 'Radios, transponder set to ALT, GPS programmed',
        why: 'All avionics should be configured before takeoff: COM frequency set, ATIS noted, transponder in ALT mode (so it reports altitude to ATC), and GPS flight plan loaded and verified. Troubleshooting avionics in the air is dangerous distraction.',
        answerVariants: [
          'Radios, transponder in ALT mode, and GPS loaded before takeoff — troubleshooting avionics in the air is dangerous distraction.',
          'Transponder in ALT mode reports your altitude to ATC radar — in SBY you\'re invisible.',
          'Anything you have to figure out in the air is cognitive load you can\'t afford — configure everything on the ground.',
        ],
        seqQuestion: 'Why configure all avionics before takeoff rather than after you\'re airborne?',
        distractors: [
          'Avionics must be confirmed on before the transponder can synchronize its altitude encoder.',
          'Radios must be set before taxiing to allow ATC time to log your departure intentions.',
          'Avionics power-on during runup confirms the alternator output is adequate to sustain full electrical load in flight.',
          'GPS must be programmed before engine start to allow satellite acquisition before you taxi.',
          'Confirming avionics are set verifies the voltage regulator won\'t trip during high electrical demand at takeoff.',
        ],
        tip: 'Mnemonic for transponder: ALT mode = altitude reporting = always on in flight. Code 1200 = VFR squawk if no ATC code assigned.', zone: 'avionics' },
      { action: 'Squawk Code', value: 'SET & VERIFY', note: 'Enter code from ATC clearance; confirm ALT mode',
        why: 'The transponder broadcasts your identity and altitude to ATC radar. The wrong code can make you appear as another aircraft or trigger alerts. ALT mode reports your pressure altitude. SBY (standby) means you\'re invisible to radar.',
        answerVariants: [
          'The transponder broadcasts your identity and altitude to radar — wrong code makes you appear as another aircraft or triggers emergency alerts.',
          'ATC uses your squawk to track you on radar — a wrong code creates confusion or inadvertently triggers emergency protocols.',
          'ALT mode reports pressure altitude automatically; SBY mode makes you completely invisible to ATC radar.',
        ],
        distractors: [
          'The squawk code must be set before taxi so ATC can sequence you behind other arriving traffic.',
          'Entering the squawk code arms the ELT to transmit on 406 MHz if the aircraft exceeds 5G deceleration.',
          'Squawk code entry initializes the GPS to receive WAAS correction signals from the satellite network.',
          'The correct squawk code must be entered for the transponder to encrypt your altitude transmission.',
          'Setting the squawk code before takeoff allows the tower to verify your weight class for wake turbulence spacing.',
        ],
        tip: 'Enter the code one digit at a time, verify visually on the display, then check mode is ALT. Never enter 7500, 7600, or 7700 accidentally — these are emergency codes.', zone: 'avionics' },
      { action: 'Doors & Windows', value: 'CLOSED & LATCHED', note: 'Secure before takeoff',
        why: 'A door that opens in flight — while usually not structurally dangerous — creates enormous noise, distraction, and aerodynamic drag. Pilots have lost control attempting to close doors in flight. Secure them on the ground.',
        answerVariants: [
          'A door opening in flight creates enormous noise and distraction — pilots have lost control trying to close them.',
          'Once airborne, an open door is nearly impossible to close and creates enough distraction to be dangerous.',
          'An open door in the air is not just loud — the distraction of dealing with it has led to accidents.',
        ],
        distractors: [
          'Doors must be confirmed closed before taxi so the automatic door warning light doesn\'t illuminate on takeoff.',
          'Latching the door confirms the cabin pressurization seal is intact before climb.',
          'Closed doors are required before ATC issues takeoff clearance at controlled fields.',
          'The door latch must be confirmed to prevent the emergency exit handle from activating in turbulence.',
          'Latched doors confirm the ELT mounting bracket is secure and won\'t vibrate loose on takeoff.',
        ],
        tip: 'Lift the door handle up to verify it\'s engaged, then push the door firmly inward. You should hear the latch catch.', zone: 'seats' },
    ]
  },
  landing: {
    label: 'Before Landing',
    items: [
      { action: 'Fuel Selector', value: 'BOTH', note: 'Ensure both tanks selected',
        why: 'Switching to BOTH before landing ensures you have maximum fuel available for a go-around and eliminates the risk of the selected tank running dry during the approach, which requires full power at a critical moment.',
        answerVariants: [
          'BOTH before landing ensures maximum fuel for a go-around and eliminates the risk of the selected tank running dry on approach.',
          'An engine failure on final from a dry tank is not recoverable — switching to BOTH is cheap insurance.',
          'Go-arounds need immediate full power — you want both tanks available, not one that might be close to empty.',
        ],
        seqQuestion: 'Why switch to BOTH before the approach rather than leaving it where it was?',
        distractors: [
          'BOTH position is required by ATC for landing at controlled airports to verify fuel state.',
          'Switching to BOTH on downwind equalizes fuel between tanks to prevent asymmetric weight on landing.',
          'BOTH position activates the fuel totalizer\'s landing mode to record approach fuel burn.',
          'Switching to BOTH before landing confirms the fuel selector hasn\'t frozen from cold temperatures.',
          'BOTH position is required so the electric fuel pump can draw from either tank during the flare.',
        ],
        tip: 'Check it on downwind as part of your "GUMPS" check.', tipType: 'acronym', acronym: 'GUMPS', acronymDef: 'Gas (BOTH) · Undercarriage (down — if retractable) · Mixture (rich) · Prop (full forward — if variable) · Seat belts (secure)', zone: 'fuel' },
      { action: 'Mixture', value: 'RICH (or as required)', note: 'Enrich for go-around power availability',
        why: 'If you need to go around, you\'ll need full power immediately. A lean mixture can cause the engine to run rough or lose power at full throttle. Enriching on the downwind ensures the engine is ready for max power on demand.',
        answerVariants: [
          'A go-around needs full power immediately — a lean mixture causes rough running or power loss at exactly that moment.',
          'You enrich on downwind so the engine is ready for max power on demand; diagnosing rough running on final isn\'t an option.',
          'Rich mixture ensures smooth full-power response if you go around — leaning back after landing is easy.',
        ],
        distractors: [
          'Rich mixture on approach cools the cylinders before the power reduction of landing.',
          'Mixture must be rich before landing so the fuel flow gauge reads accurately for approach speed calculation.',
          'Rich mixture ensures the carburetor main jet stays clear before the throttle is reduced for approach.',
          'Enriching on downwind confirms the mixture cable has full travel and won\'t stick at partial position.',
          'Rich mixture prevents vapor lock in the fuel lines at the lower power settings used on approach.',
        ],
        tip: 'Part of GUMPS on downwind — M = Mixture rich.', zone: 'mixture' },
      { action: 'Carb Heat', value: 'AS REQUIRED', note: 'On if conditions warrant; monitor RPM for ice',
        why: 'At reduced power settings on approach, the carburetor is more susceptible to icing — particularly in humid conditions at 20-70°F. If in doubt, carb heat on. Remember to return it to cold before any go-around (it reduces power).',
        answerVariants: [
          'Low power on approach makes the carb more susceptible to icing — carb heat prevents it from forming at this critical phase.',
          'At 20-70°F with humidity, reduced approach power creates prime conditions for carb ice — heat prevents it.',
          'Carb heat prevents ice at low approach power, but remember: OFF for go-around, because it reduces available power.',
        ],
        seqQuestion: 'Why is carb ice more of a concern during approach than during cruise?',
        distractors: [
          'Carb heat is applied on approach so the engine temperature stabilizes before shutdown.',
          'Carb heat on approach confirms the heat exchanger hasn\'t cracked and isn\'t venting exhaust gases into the cabin.',
          'Applying carb heat on approach prevents the throttle butterfly from freezing in a partially closed position.',
          'Carb heat on approach is required at night to improve idle stability during low-visibility landings.',
          'Carb heat prevents moisture in the fuel from freezing in the carburetor bowl during descent.',
        ],
        tip: 'Carb heat on approach is good practice in marginal conditions. But remember: carb heat OFF for go-around — you need full power.', zone: 'carbheat' },
      { action: 'Seats & Belts', value: 'SECURE', note: 'Confirm both occupants belted',
        why: 'Landing is the highest-risk phase of flight for injury in an accident. Shoulder harnesses significantly reduce injury in hard landings. Check both occupants — passengers may have loosened their belts during flight.',
        answerVariants: [
          'Landing is the highest-risk phase for injury — shoulder harnesses dramatically reduce injury in hard landings.',
          'Check passengers too — they may have loosened their belts during flight without telling you.',
          'A hard landing without a shoulder harness means your head goes into the instrument panel — this is the phase where it matters most.',
        ],
        distractors: [
          'Seatbelt check on downwind is required to confirm the door seal is still intact before landing.',
          'Belts must be confirmed secure before landing so the aircraft\'s ELT activates correctly in a crash.',
          'Seat belt confirmation is required by ATC before landing clearance can be issued.',
          'Confirming belts secure prevents the seat from sliding forward during the landing flare.',
          'Shoulder harness must be confirmed on so the inertia reel can lock during the landing roll.',
        ],
        tip: 'Announce it: "Seat belts check — mine\'s locked." Then look over at your passenger.', zone: 'seats' },
      { action: 'Airspeed (downwind)', value: '90 KIAS', note: 'Reduce from cruise; verify before pattern entry',
        why: 'Slowing to pattern speed on downwind gives you time to configure the aircraft without rushing. 90 KIAS is the C172 standard downwind speed — fast enough for safety margin, slow enough to add flaps on base.',
        answerVariants: [
          'Pattern speed on downwind gives time to configure the aircraft without rushing — too fast and you blow through the base turn.',
          '90 KIAS is slow enough to add flaps on base but fast enough for a safety margin — the sweet spot for pattern work.',
          'Slowing on downwind sets up a stabilized approach — arriving at base still at cruise speed makes stabilization impossible.',
        ],
        distractors: [
          '90 KIAS on downwind is required by ATC to maintain separation from following traffic in the pattern.',
          'Slowing to 90 KIAS on downwind activates the stall warning system for final approach monitoring.',
          'Pattern speed of 90 KIAS corresponds to the airspeed at which elevator trim is most effective.',
          'Reducing to 90 KIAS on downwind allows the vacuum pump to build sufficient suction for the landing flare.',
          '90 KIAS is the maximum airspeed at which the flap actuator motor can extend flaps without damage.',
        ],
        tip: 'Reduce power to ~1500 RPM abeam the numbers. Let speed bleed to 90, add first notch of flaps (10°).', zone: 'sixpack' },
      { action: 'Flaps (base)', value: '20°', note: 'Add second notch on base leg',
        why: 'Adding flaps progressively (not all at once) lets you control the pitch change each time. 20° on base steepens your descent and slows you further for a stabilized final approach. Full flaps (30°) added on final if runway assured.',
        answerVariants: [
          'Progressive flap extension controls pitch changes — dumping all flaps at once causes a sudden nose pitch you have to chase.',
          '20° on base steepens descent and slows you for stabilized final — full flaps added on final when runway is assured.',
          'Incremental flap extension means smaller trim adjustments each time, giving you a more stable, predictable approach.',
        ],
        seqQuestion: 'Why add flaps in stages (10° downwind, 20° base, 30° final) rather than all at once?',
        distractors: [
          'Adding flaps in stages allows the hydraulic actuator to cool between extensions to prevent overheating.',
          'FAR 91 requires flap extension to be completed in stages to comply with the maximum demonstrated extension rate.',
          '20° flaps on base activates the stall warning horn earlier to provide advance warning before final approach.',
          'Progressive flap extension ensures landing gear doors don\'t contact the flap actuator mechanism.',
          'Adding flaps in stages allows the vacuum system to maintain sufficient pressure for attitude indicator accuracy.',
        ],
        tip: 'Each notch: check airspeed is below Vfe (white arc top = 85 KIAS), add flap, re-trim.', zone: 'flaps' },
      { action: 'Airspeed (final)', value: '65–70 KIAS', note: 'With full flaps; adjust for weight/wind',
        why: '65 KIAS is the C172 Vref with full flaps at typical training weights. Add half the gust factor in gusty conditions.',
        answerVariants: [
          '65 KIAS is C172 Vref with full flaps — too slow and you\'re at stall margins; too fast and you float and can\'t stop.',
          'Flying too fast on final means a long float using up runway — too slow means a dangerously thin stall margin.',
          'Vref gives proper stall margin above actual landing speed — in gusts, add half the gust factor on top.',
        ],
        distractors: [
          '65-70 KIAS on final activates the ground proximity warning system for the landing flare.',
          'Flying final at 65 KIAS corresponds to the airspeed at which the elevator is most effective for the flare.',
          'Final approach speed of 65-70 KIAS is required by ATC for proper wake turbulence spacing on short final.',
          'Flying final at 65 KIAS ensures the prop turns fast enough to avoid prop strike during the flare.',
          '65-70 KIAS on final sets the stall warning horn to trigger at the correct height for landing flare timing.',
        ],
        tip: 'Look at the far end of the runway throughout the flare — not the nose or the numbers.', zone: 'sixpack' },
      { action: 'Go-Around', value: 'BRIEF & READY', note: 'Have plan — unstabilized = go around',
        why: 'Deciding to go around on the ground takes far less courage than deciding at 50 feet. If not stabilized by 500 ft AGL — go around. No exceptions.',
        answerVariants: [
          'Deciding to go around on the ground is easy — deciding at 50 feet is hard. Brief it before you need it.',
          'If not stabilized by 500 ft AGL you need an immediate automatic decision — briefing ahead makes it a reflex, not a debate.',
          'A go-around you\'ve already mentally committed to takes half a second; one you\'re deciding for the first time at 50 feet takes too long.',
        ],
        seqQuestion: 'Why mentally brief the go-around procedure before you start the approach?',
        distractors: [
          'Briefing the go-around procedure is required by ATC before they can issue landing clearance.',
          'Go-around briefing activates the terrain awareness system to monitor runway surface conditions.',
          'Briefing go-around at pattern entry allows ATC to pre-sequence you behind arriving traffic on the parallel.',
          'The go-around briefing confirms the flap retraction sequence with your passenger before the approach.',
          'Briefing the go-around sets a mental checklist that triggers automatically if the stall warning sounds.',
        ],
        tip: 'Go-around: Full throttle → carb heat COLD → pitch for Vy (74 KIAS) → flaps 20° → 10° → 0°.', zone: 'throttle' },
    ]
  }
    },
    emergencies: [
  {
    icon: '🔥',
    severity: 'critical',
    title: 'Engine Fire — Starting',
    situation: 'During engine start, flames appear from the engine cowling. What is your FIRST action?',
    correct: 1,
    options: [
      'Shut off fuel selector and mixture immediately',
      'Continue cranking — draw fire into engine',
      'Jump out immediately and call for help',
      'Call tower on radio first'
    ],
    explanation: 'Continue cranking to draw the fire back into the engine with mixture rich and throttle full open. If fire persists after ~30 seconds, shut everything down and evacuate.',
    why: "Counterintuitive but correct — continued cranking ingests the fire into the intake manifold. Only abort and evacuate if cranking doesn't extinguish it quickly."
  },
  {
    icon: '⚠️️',
    severity: 'critical',
    title: 'Engine Failure — Low Altitude',
    situation: 'Engine fails immediately after liftoff at 200 ft AGL. Runway behind you. First action?',
    correct: 0,
    options: [
      'Lower nose, land straight ahead',
      'Turn back to runway immediately',
      'Declare emergency on radio',
      'Raise flaps and maintain best glide'
    ],
    explanation: 'Immediately lower the nose to maintain flying speed and land straight ahead (or a slight turn if needed). Below ~500 ft AGL you almost certainly cannot make it back.',
    why: "The 'impossible turn' back to runway kills pilots. At low altitude the math almost never works. Land what's in front of you — even off-field. Fly the airplane first."
  },
  {
    icon: '📊',
    severity: 'critical',
    title: 'Engine Failure — Cruise',
    situation: 'At 4,500 ft MSL, engine quits suddenly. Correct memory item sequence?',
    correct: 2,
    options: [
      'Declare Mayday → Best glide → Restart checklist',
      'Best glide → Land immediately → Skip restart',
      'Best glide → Fuel BOTH → Mixture RICH → Carb heat ON → Restart attempt',
      'Carb heat ON → Mayday → Best glide'
    ],
    explanation: 'Best glide first (65 KIAS in C172) — altitude = time. Then work restart: fuel selector BOTH, mixture rich, primer in/locked, carb heat on. Identify a landing area while working.',
    why: 'Flying the airplane is always job one. Best glide maximizes range and options. Identify a landing area while you troubleshoot — not after.'
  },
  {
    icon: '🌡️',
    severity: 'high',
    title: 'Carburetor Ice',
    situation: 'Cruise at 3,000 ft, humid 50°F day. Gradual unexplained RPM drop, no roughness. First action?',
    correct: 1,
    options: [
      'Lean aggressively — fouled plug',
      'Apply full carb heat immediately',
      'Switch fuel tanks',
      'Check magnetos L/R'
    ],
    explanation: 'Gradual RPM loss with no roughness in humid, moderate-temp air is classic carb ice. Apply full carb heat — expect a further temporary RPM drop as ice melts. That drop confirms the diagnosis.',
    why: 'Carb ice forms between 20–70°F with visible moisture — prime altitude conditions. The temporary RPM drop after carb heat is the good news: you\'re melting ice.'
  },
  {
    icon: '⚡',
    severity: 'high',
    title: 'Electrical Failure',
    situation: 'Ammeter shows discharge. Alternator light illuminates. First action?',
    correct: 3,
    options: [
      'Land immediately — no power available',
      'Turn on all lights to discharge static',
      'Declare emergency',
      'Check alternator circuit breaker — reset if tripped'
    ],
    explanation: 'Check the alternator circuit breaker first — often the culprit. Reset once if tripped. If that fails, shed non-essential electrical load and plan to land before battery depletes (~30 min).',
    why: "A tripped CB is a simple fix. If it trips again after reset, don't reset — there's an underlying fault. Battery gives roughly 30 min of essential loads."
  }
    ]
  },

  cherokee140: {
    name: 'Cherokee 140',
    label: 'Cherokee 140',
    variant: 'Piper PA-28-140',
    engine: 'Lycoming O-320 · 150 HP',
    speeds: { vr: 48, vx: 66, vy: 75, vfe: 101, approach: 70, shortFinal: 59, bestGlide: 60, vs0: 41, vs: 50, va: 100, vno: 124, vne: 155 },
    checklists: {
      preflight: {
        label: 'Preflight',
        items: [
          { action: 'Hobbs / Tach', value: 'CHECK', note: 'Record for billing and engine maintenance', why: 'Hobbs records engine time for billing and TBO tracking. Always note times before and after flight.', tip: 'Photo the gauges with your phone before engine start.', zone: 'sixpack',
            checks: [
              { text: 'Record current Hobbs time — establishes the baseline for billing and logbook accuracy', correct: true },
              { text: 'Record current Tach time — tracks RPM-weighted hours for maintenance intervals', correct: true },
              { text: 'Verify both meters read identically — a mismatch flags a prop governor fault', correct: false },
              { text: 'Note whether Hobbs advanced since the last entry — confirms the engine actually ran', correct: false },
            ] },
          { action: 'Fuel Quantity', value: 'CHECK VISUALLY', note: 'Always visually confirm — gauges unreliable', why: 'Fuel gauges are only required to be accurate at empty. Physically look into each tank to confirm level.', tip: 'Blue = 100LL. Any other color or cloudiness — do not fly.', zone: 'oil',
            checks: [
              { text: 'Sufficient fuel for the planned route plus required reserves — confirmed visually, not from gauges', correct: true },
              { text: 'Actual level seen directly through the filler neck — gauges are only required to be accurate at empty', correct: true },
              { text: 'Cockpit gauge reading matches the visual level', correct: false },
              { text: 'Both tanks are within 5 gallons of each other to prevent handling problems', correct: false },
            ] },
          { action: 'Fuel Caps', value: 'SECURE', note: 'Both caps tight and locked', why: 'Loose caps allow fuel to siphon out in flight, especially on a low-wing where fuel heads are higher.', tip: 'Twist firmly until it stops, then tug upward to verify.', zone: 'oil',
            checks: [
              { text: 'Each cap is fully seated and locked — won\'t pull free when tugged', correct: true },
              { text: 'Vent holes are open and unobstructed — a blocked vent causes fuel starvation on a low-wing', correct: true },
              { text: 'Caps are installed on the correct tank after refueling', correct: false },
              { text: 'Cap color matches the tank placard — blue cap on left, red on right', correct: false },
            ] },
          { action: 'Fuel Drains', value: 'DRAIN & CHECK', note: 'Check for water and correct color', why: 'Low-wing aircraft sumps sit lower — water accumulates readily. Drain each sump until the sample runs clear and blue.', tip: 'Drain into a clear tester cup. Water sinks to the bottom — even a few drops can be dangerous.', zone: 'oil',
            checks: [
              { text: 'Sample is clear with no visible water layer at the bottom of the tester cup', correct: true },
              { text: 'Correct fuel color — blue confirms 100LL avgas, not jet fuel or a misfuel', correct: true },
              { text: 'Volume drained is adequate — at least one full cup per sump to reach any settled contamination', correct: false },
              { text: 'Unusual smell alone is sufficient to abort the flight even without visible contamination', correct: false },
            ] },
          { action: 'Oil Quantity', value: 'CHECK — MIN 6 QTS', note: 'Check dipstick; add if needed', why: 'Oil is life for the engine. The Cherokee\'s Lycoming O-320 typically holds 8 quarts max. Below 6 is marginal for longer flights.', tip: 'Wipe dipstick clean, reinsert fully, then read.', zone: 'oil',
            checks: [
              { text: 'Dipstick reads at least 6 quarts — the Cherokee minimum for safe operations', correct: true },
              { text: 'Oil appears normal — milky color means water contamination, very black means overdue for change', correct: true },
              { text: 'Level matches the squawk book entry from the last flight', correct: false },
              { text: 'Both dipstick insertions read the same level as a consistency check', correct: false },
            ] },
          { action: 'Oil Cap', value: 'SECURE', note: 'Hand-tight and locked', why: 'Loose oil cap sprays hot oil on the windshield and engine, causing loss of visibility and potential fire.', tip: 'Say out loud: "Cap is on and locked."', zone: 'oil',
            checks: [
              { text: 'Cap is fully seated and won\'t pull free when tugged', correct: true },
              { text: 'No fresh oil spray or residue around the cap — would indicate it was loose in a previous flight', correct: true },
              { text: 'Cap alignment mark points to the 12 o\'clock index position', correct: false },
              { text: 'Cap gasket condition is assessed visually without tools', correct: false },
            ] },
          { action: 'Fuel Selector', value: 'PROPER TANK', note: 'Select the fullest tank for start', why: 'Unlike the C172\'s BOTH position, the Cherokee has LEFT / RIGHT / OFF. Select the fuller tank to start and for takeoff.', tip: 'Fuel selector is on the floor between the seats. Verify visually — don\'t assume.', zone: 'fuel',
            checks: [
              { text: 'Selector is in LEFT or RIGHT — not OFF — for engine start and takeoff', correct: true },
              { text: 'Fuller tank is selected to maximize available fuel through initial climb', correct: true },
              { text: 'Selector is in the BOTH position to ensure equal draw from both tanks', correct: false },
              { text: 'Selector valve is wire-locked in position to prevent accidental movement in flight', correct: false },
            ] },
          { action: 'Pitot Tube', value: 'UNOBSTRUCTED', note: 'Check for insects, debris, cover removed', why: 'Blocked pitot = false airspeed. The pitot cover must be removed — check for the "Remove Before Flight" streamer.', tip: 'If you installed the cover, YOU remove it.', zone: 'pitot',
            checks: [
              { text: 'Tube opening is clear — no insects, mud, or debris blocking it', correct: true },
              { text: 'Pitot cover has been removed and is stowed or returned', correct: true },
              { text: 'Heating element is visible and intact inside the tube opening', correct: false },
              { text: 'Tube is pointed slightly downward to allow moisture drainage', correct: false },
            ] },
          { action: 'Static Ports', value: 'CLEAR', note: 'Both sides of fuselage', why: 'Blocked static ports freeze the altimeter and VSI. Flush holes — check for tape, mud, or insects.', tip: 'Run your fingernail over each port. Clear = nothing catches.', zone: 'static',
            checks: [
              { text: 'Both ports are clear — run a fingertip over each to feel for tape, mud, or insect blockage', correct: true },
              { text: 'Both sides of the fuselage are checked — there is one port per side', correct: true },
              { text: 'Ports are aimed perpendicular to the slipstream for accurate static pressure readings', correct: false },
              { text: 'Static port covers have been removed (most aircraft don\'t use removable covers)', correct: false },
            ] },
          { action: 'Control Surfaces', value: 'FREE & CORRECT', note: 'Full deflection — verify correct direction', why: 'Reversed or restricted controls have caused fatal accidents. Always verify visually that the surface moves the right way.', tip: 'Yoke right: right aileron UP. Yoke back: elevator UP. Rudder left: rudder left.', zone: 'controls',
            checks: [
              { text: 'Controls move freely to full deflection in all directions with no binding or unusual resistance', correct: true },
              { text: 'Controls move in the correct direction — right yoke produces right aileron UP', correct: true },
              { text: 'Control cable routing is verified under the engine cowling', correct: false },
              { text: 'Trim tabs are in the neutral position before setting takeoff trim', correct: false },
            ] },
          { action: 'Tires', value: 'CONDITION & INFLATION', note: 'All three — check for cuts and flat spots', why: 'Underinflated or damaged tires can blow on landing. The Cherokee sits lower than most — tires are easy to check.', tip: 'Press firmly with your thumb. Any cord showing = do not fly.', zone: 'tires',
            checks: [
              { text: 'Proper inflation — tire sidewall feels firm under thumb pressure, not soft', correct: true },
              { text: 'No flat spots on the tread, which indicate hard braking in a previous landing', correct: true },
              { text: 'No exposed cord, deep cuts, or large gouges on any of the three tires', correct: true },
              { text: 'Tread depth meets the minimum legal requirement (like automobile tire laws)', correct: false },
              { text: 'Tire pressure matches the exact PSI value stamped on the sidewall', correct: false },
            ] },
          { action: 'Tie-downs / Chocks', value: 'REMOVED', note: 'Remove all before engine start', why: 'Attempting to taxi with tie-downs attached is more dangerous on a low-wing — propeller blast won\'t reveal them.', tip: 'Walk all the way around during preflight and you\'ll see them naturally.', zone: 'tires',
            checks: [
              { text: 'Both wing tie-down ropes are removed and stowed', correct: true },
              { text: 'All wheel chocks are removed from in front of and behind the main wheels', correct: true },
              { text: 'Tie-down cleats on the ramp are properly rated for the aircraft\'s maximum gross weight', correct: false },
              { text: 'Tie-down ropes are inspected for fraying before being stored away', correct: false },
            ] },
        ]
      },
      beforestart: {
        label: 'Before Start',
        items: [
          { action: 'Seat Track / Back', value: 'LOCK', note: 'Adjust and lock — both occupants', why: 'Unlocked seat rails can cause the seat to slide aft on rotation — you\'d lose control with no way to reach the yoke.', tip: 'Push seat back hard after adjusting. No movement = locked.', zone: 'seats' },
          { action: 'Avionics', value: 'OFF', note: 'Protect from start voltage spike', why: 'Engine start causes a momentary voltage spike that can damage radios and GPS. Turn all avionics off before master.', tip: '"Avionics off first, avionics on last" — every aircraft, every time.', zone: 'avionics' },
          { action: 'Autopilot', value: 'OFF', note: 'Disconnect before start', why: 'Autopilot servos engaged during start can cause unexpected control inputs when the electrical system surges.', tip: 'Short toggle — verify the AP annunciator is out.', zone: 'avionics' },
          { action: 'Carb Heat', value: 'OFF (COLD)', note: 'Cold for start — on only if icing suspected in flight', why: 'Carb heat bypasses the air filter and reduces power. Never use it on the ground unless troubleshooting icing.', tip: 'The Cherokee Lycoming O-320 is particularly susceptible to carb ice at low power — always check carb heat in flight.', zone: 'carbheat' },
          { action: 'Mixture', value: 'FULL RICH', note: 'Rich for start at sea level', why: 'Rich mixture ensures adequate fuel for cold start. Lean only at high density altitude airports.', tip: 'Red knob full IN = rich.', zone: 'mixture' },
          { action: 'Throttle', value: 'SLIGHT', note: '1/4 to 1/2 inch open', why: 'Too closed and the engine won\'t catch. Too open and it may race dangerously after starting.', tip: 'Two finger widths from fully closed.', zone: 'throttle' },
          { action: 'Fuel Selector', value: 'PROPER TANK', note: 'Fuller tank for start', why: 'The Cherokee has no BOTH — you must select L or R. The fuller tank reduces the chance of running a tank dry at a bad time.', tip: 'Look at the selector, not just feel it. The detent clicks are similar for L and R.', zone: 'fuel' },
          { action: 'Brakes', value: 'SET', note: 'Hold firmly during start', why: 'Engine start generates prop blast. Holding brakes keeps the aircraft stationary on the ramp.', tip: 'Press both toe brakes and hold. Release only when ready to taxi.', zone: 'tires' },
        ]
      },
      start: {
        label: 'Engine Start',
        items: [
          { action: 'Beacon', value: 'ON', note: 'Signal others — engine about to start', why: 'The beacon is the universal "prop is turning" warning. Always on before the starter engages.', tip: 'Beacon on = engine running or starting. Last thing off after shutdown.', zone: 'beacon' },
          { action: 'Master', value: 'ON', note: 'Both ALT and BAT', why: 'Powers the electrical system. Some pilots turn BAT on first to check voltage, then ALT.', tip: 'Left side = ALT, right side = BAT on the split rocker.', zone: 'master' },
          { action: 'Fuel Pump', value: 'ON', note: 'Electric boost pump on for start', why: 'The Cherokee has an electric fuel pump to prime the fuel-injected or carbureted system and ensure fuel pressure before the engine-driven pump takes over. On for start, off after engine running.', tip: 'Check fuel pressure rises after pump ON. Should show green within seconds.', zone: 'throttle' },
          { action: 'Prime', value: 'AS REQUIRED', note: 'Cold engine: 2–4 strokes; hot start: none', why: 'Cold engines need raw fuel in the intake. Hot engines already have residual fuel — over-priming floods it.', tip: 'Hot start: skip prime, set mixture idle-cutoff, crank until it catches, then advance mixture quickly.', zone: 'primer' },
          { action: 'Mags', value: 'START', note: 'Both mags — START position', why: 'START engages the starter motor. Release immediately when the engine catches.', tip: 'Don\'t crank more than 10 seconds. Rest 30 seconds between attempts to protect the starter.', zone: 'ignition' },
          { action: 'Fuel Pump', value: 'OFF (after start)', note: 'Off once engine running smoothly', why: 'Running the electric pump continuously can flood the carburetor or cause vapor lock in fuel-injected models. Off after engine-driven pump takes over.', tip: 'Watch fuel pressure — it should hold steady after turning pump off. If it drops: investigate.', zone: 'throttle' },
          { action: 'Oil Pressure', value: 'CHECK (30s)', note: 'Should rise within 30 seconds', why: 'No oil pressure means oil isn\'t circulating. Continued running causes rapid engine damage.', tip: 'Eyes on the oil pressure gauge immediately after start. Green within 30s or shut down.', zone: 'sixpack' },
        ]
      },
      runup: {
        label: 'Runup',
        items: [
          { action: 'Engine Warm-up', value: '1000 RPM', note: 'Allow oil temp to rise before runup', why: 'Cold oil doesn\'t lubricate as well. Wait for oil temperature to show movement before runup checks.', tip: 'On cold days this may take several minutes. Don\'t rush it.', zone: 'sixpack' },
          { action: 'Throttle', value: '2000 RPM', note: 'Set for runup checks', why: 'The Cherokee Lycoming O-320 runup is typically done at 2000 RPM — slightly higher than the C172\'s 1700-1800 RPM setting.', tip: 'Set smoothly. Rapid throttle advances can cause engine stress when cold.', zone: 'throttle' },
          { action: 'Magnetos', value: 'CHECK L/R (R-L-Both)', note: 'Max RPM drop per mag check', why: 'Each magneto is tested independently. A large RPM drop indicates fouled plugs or mag issues.', tip: 'BOTH → R (note drop) → BOTH → L (note drop) → BOTH. Max ~125 RPM drop, max 50 RPM difference between mags.', zone: 'ignition' },
          { action: 'Carb Heat', value: 'ON — TEST', note: 'Slight RPM drop expected; return to COLD', why: 'Warm unfiltered air reduces power slightly — a small RPM drop is normal and expected. Return to COLD before takeoff.', tip: 'If RPM initially drops then rises above original = you had ice. Normal drop then back = no ice.', zone: 'carbheat' },
          { action: 'Vacuum', value: 'CHECK', note: 'Should read ~5 in. Hg in green arc', why: 'Vacuum drives the attitude indicator and directional gyro. Low vacuum means unreliable gyro instruments.', tip: 'Green arc on the gauge. Any reading below = investigate before flight in IMC.', zone: 'sixpack' },
          { action: 'Amps / Volts', value: 'CHECK', note: 'Ammeter should show charge', why: 'Confirms the alternator is charging the battery. Discharge at runup = possible alternator or regulator issue.', tip: 'Ammeter needle in the + (positive/charge) side. Zero or negative = problem.', zone: 'sixpack' },
          { action: 'Oil Pressure', value: 'GREEN', note: 'In normal operating range', why: 'Oil pressure should be fully stabilized by runup. Any fluctuation or below-green reading = abort.', zone: 'sixpack', tip: 'If it was good at startup but has dropped at runup — something changed. Don\'t depart.', },
          { action: 'Oil Temperature', value: 'GREEN', note: 'Warm enough to proceed', why: 'Running a full-power takeoff with cold oil stresses engine internals. Oil temp in green = ready.', tip: 'Wait for the needle to enter the green arc — not just show movement.', zone: 'sixpack' },
          { action: 'Throttle', value: 'IDLE — CHECK CLOSED', note: 'Verify idle; return to 1000 RPM for taxi', why: 'Checks that the throttle returns to proper idle and won\'t stick.', tip: 'Idle should be smooth at ~600-700 RPM. Rough idle = possible fouled plug or carb issue.', zone: 'throttle' },
          { action: 'Friction Lock', value: 'AS DESIRED', note: 'Set throttle friction', why: 'The Cherokee has a friction lock on the throttle to prevent creep. Set to hold position without requiring constant hand pressure.', tip: 'Tighten until throttle stays where you set it but can still be moved deliberately.', zone: 'throttle' },
          { action: 'Flight Controls', value: 'FREE & CORRECT', note: 'Full deflection each direction', why: 'Final confirmation that nothing is blocking controls before takeoff. Full deflection only — partial doesn\'t count.', tip: 'Yoke right: right aileron UP. Back: elevator UP. Rudder left: left rudder.', zone: 'controls' },
          { action: 'Trim', value: 'SET TAKEOFF', note: 'Elevator trim to takeoff range', why: 'Correct trim reduces stick force at rotation. Wrong trim = fighting the aircraft at the worst moment.', tip: 'Trim wheel is on the ceiling between the seats in most Cherokees — easy to miss.', zone: 'trim' },
          { action: 'Fuel Selector', value: 'PROPER TANK', note: 'Fuller tank for takeoff', why: 'Takeoff is the most critical phase. Use the fuller tank so you have maximum fuel available if a go-around is needed immediately.', tip: 'Look at the selector — don\'t just feel the position.', zone: 'fuel' },
          { action: 'Primer', value: 'IN & LOCKED', note: 'Confirm locked before takeoff', why: 'Vibration can unlatch an improperly locked primer, causing lean mixture and rough running at full power.', tip: 'Tug it outward — it should not move at all.', zone: 'primer' },
          { action: 'Doors & Windows', value: 'CLOSED & LATCHED', note: 'Secure all before departure', why: 'A Cherokee door opening in flight creates noise and distraction. The Cherokee\'s door design makes it prone to appearing closed when it isn\'t fully latched.', tip: 'Lift the handle and push the door firmly inward. Listen for the latch click.', zone: 'seats' },
        ]
      },
      landing: {
        label: 'Before Landing',
        items: [
          { action: 'Fuel Selector', value: 'PROPER TANK', note: 'Fullest tank for approach and go-around', why: 'Engine failure on approach due to fuel exhaustion on the selected tank is a known accident cause. Use the fuller tank.', tip: 'Part of GUMPS on downwind — G = Gas (proper tank).', tipType: 'acronym', acronym: 'GUMPS', acronymDef: 'Gas (proper tank) · Undercarriage · Mixture (rich) · Prop · Seatbelts', zone: 'fuel' },
          { action: 'Fuel Pump', value: 'ON', note: 'Electric pump on for approach', why: 'The electric boost pump provides backup fuel pressure in case the engine-driven pump falters at low power settings during approach. Critical for go-around power availability.', tip: 'On before you start the approach. Off only after landing and clear of the runway.', zone: 'throttle' },
          { action: 'Mixture', value: 'BEST POWER', note: 'Enrich for go-around capability', why: 'A lean mixture at full throttle during a go-around can cause the engine to run rough or lose power at the worst moment. Enrich before approach.', tip: 'At low altitudes: full rich. At higher elevations: best power mixture (slightly leaned).', zone: 'mixture' },
          { action: 'Carb Heat', value: 'AS REQUIRED', note: 'On if icing conditions suspected', why: 'Carb ice forms readily at low power — prime approach conditions. Apply carb heat if temps are 20-70°F and there\'s visible moisture.', tip: 'Remember to go CARB HEAT OFF for go-around — you need full power without restriction.', zone: 'carbheat' },
          { action: 'Seats & Belts', value: 'SECURE', note: 'Both occupants — shoulder harness on', why: 'Landing is the highest-risk phase for injury. Shoulder harnesses dramatically reduce injury in hard landings. Check your passenger too.', tip: 'Announce it out loud: "Belts — mine\'s locked." Then look at your passenger.', zone: 'seats' },
          { action: 'Flaps', value: '10°–25° AS REQ.', note: 'Progressive — based on conditions', why: 'Unlike the C172\'s fixed flap schedule, the Cherokee gives you flexibility. 10° for short field initial, 25° for normal full flap landing. 40° is the maximum.', tip: '25° flaps for normal full-stop. Below Vfe (101 KIAS) before extending.', zone: 'flaps' },
          { action: 'Airspeed (final)', value: '70 KIAS / 59 SHORT', note: 'Approach 70, short final 59 KIAS', why: 'The Cherokee is heavier and stalls at a higher speed than it appears. 70 KIAS gives adequate margin. Short final 59 KIAS is the published approach speed with flaps.', tip: 'Add half the gust factor in gusty winds. If gusting 10 knots, fly final at 74-75 KIAS.', zone: 'sixpack' },
          { action: 'Go-Around', value: 'BRIEF & READY', note: 'Unstabilized at 500 ft AGL = go around', why: 'The Cherokee is heavier and slower to accelerate than a C172. A go-around decision made late is a go-around that might not succeed. Decide early.', tip: 'Go-around: Full power → Carb heat OFF → Positive climb → Flaps 25° → Flaps 0° above 70 KIAS.', zone: 'throttle' },
        ]
      }
    },
    emergencies: [
  {
    icon: '🔥',
    severity: 'critical',
    title: 'Engine Fire — Starting',
    situation: 'During engine start, flames appear from the cowling. First action?',
    correct: 0,
    options: [
      'Mixture to idle cutoff, fuel selector OFF, evacuate',
      'Continue cranking to draw fire in',
      'Apply fire extinguisher through the cowl flap',
      'Call for help on radio first'
    ],
    explanation: 'On the Cherokee: mixture to idle cutoff, fuel selector OFF, master OFF, evacuate. Unlike the C172 (where you crank to ingest the fire), the Cherokee procedure is to cut fuel and evacuate immediately.',
    why: 'The Cherokee has a different starting fire procedure than the C172 — confirm with your specific POH. The key difference: cut the fuel source immediately rather than trying to ingest the fire.'
  },
  {
    icon: '⚠️️',
    severity: 'critical',
    title: 'Engine Failure — Low Altitude',
    situation: 'Engine fails immediately after liftoff at 200 ft AGL. Runway behind you. First action?',
    correct: 0,
    options: [
      'Lower nose, land straight ahead',
      'Turn back to runway immediately',
      'Declare emergency on radio',
      'Raise flaps to clean up aircraft'
    ],
    explanation: 'Lower the nose immediately to maintain flying speed and land straight ahead. Below 500 ft AGL the "impossible turn" back to the runway almost never works — and the Cherokee accelerates slowly.',
    why: 'The Cherokee is heavier than a C172 and loses altitude faster in a turn. The geometry of a return to runway requires more altitude than most pilots think — 500-1000 ft minimum in practice.'
  },
  {
    icon: '⛽',
    severity: 'critical',
    title: 'Engine Failure — Cruise',
    situation: 'Engine quits at cruise. Correct first action sequence?',
    correct: 1,
    options: [
      'Declare Mayday immediately → then best glide',
      'Best glide speed (60 KIAS) → fuel selector other tank → fuel pump ON → mixture rich → check mags BOTH',
      'Switch fuel tanks → best glide → restart checklist',
      'Carb heat ON → best glide → restart'
    ],
    explanation: 'Best glide (60 KIAS) first to maximize time and options. Then: switch to the other fuel tank, fuel pump ON, mixture rich, mags to BOTH. Identify a landing area while working the restart.',
    why: 'Many Cherokee engine failures are fuel-related — wrong tank selected, or a tank run dry. Switching tanks is often the fix. The electric fuel pump ensures pressure while the engine-driven pump is windmilling.'
  },
  {
    icon: '🌡️',
    severity: 'high',
    title: 'Carburetor Ice',
    situation: 'Gradual RPM loss, humid conditions, 50°F. No roughness. First action?',
    correct: 1,
    options: [
      'Switch fuel tanks — possible contamination',
      'Full carb heat immediately',
      'Lean mixture — possible over-rich condition',
      'Check mags L/R'
    ],
    explanation: 'Apply full carb heat immediately. Expect a further RPM drop as ice melts — this confirms carb ice. Once RPM rises back, the ice is cleared. Return carb heat to cold at full power.',
    why: 'The Lycoming O-320 in the Cherokee is particularly susceptible to carb ice at low power settings — approach and cruise descent are prime times. Always use carb heat preemptively in suspect conditions.'
  },
  {
    icon: '⛽',
    severity: 'high',
    title: 'Fuel Pump Failure',
    situation: 'Fuel pressure drops in cruise. Fuel pump circuit breaker is in. First action?',
    correct: 2,
    options: [
      'Declare emergency and land immediately',
      'Switch fuel tanks — other tank may be higher',
      'Turn electric fuel pump ON — check pressure restores',
      'Lean mixture to reduce fuel flow demand'
    ],
    explanation: 'Turn the electric boost pump ON. If fuel pressure restores, the engine-driven pump has likely failed. The electric pump can sustain flight — but plan to land soon and have maintenance check the engine-driven pump.',
    why: 'The Cherokee has two fuel pumps: engine-driven (primary) and electric (backup). The electric pump is there exactly for this scenario. Low fuel pressure doesn\'t mean emergency if the backup works — but don\'t delay landing.'
  }
    ]
  }
};


const GLOSSARY = {
  'RDU Ground': { term: 'Ground Control', def: 'The ATC frequency that controls aircraft movement on the ground — taxiways, ramps, and runways not in use. You call Ground to get your taxi clearance before heading to the runway. RDU is the ICAO identifier for Raleigh-Durham International Airport.' },
  'N4521G': { term: 'Tail Number / N-Number', def: 'Your aircraft\'s unique FAA registration number, like a license plate. All US-registered aircraft start with N. When you say it on the radio, you use the phonetic alphabet: N4521G becomes "November Four Five Two One Golf." You always identify yourself this way.' },
  'Signature FBO': { term: 'FBO (Fixed Base Operator)', def: 'A private company at an airport that provides services to general aviation pilots — fuel, parking, tie-downs, pilot lounges, rental cars, and sometimes aircraft rentals. Signature is one of the largest FBO chains. Think of it as the "pilot hotel lobby" at an airport.' },
  'Taxi for VFR departure': { term: 'VFR (Visual Flight Rules)', def: 'A set of FAA regulations for flying when you can see where you\'re going — at least 3 miles visibility and clear of clouds. The alternative is IFR (Instrument Flight Rules), used in clouds. As a student pilot, you\'re flying VFR.' },
  'CTAF': { term: 'CTAF (Common Traffic Advisory Frequency)', def: 'At airports without a control tower, pilots self-announce their position on a shared radio frequency. Everyone on the frequency can hear each other and coordinate. Listed in your chart supplement — usually 122.8 or similar.' },
  'Tail': { term: 'Tail Number / Callsign', def: 'Your aircraft\'s FAA registration number, used as your callsign on the radio. Always identify yourself with this when calling ATC or making position reports.' },
  'Frequency': { term: 'Radio Frequency (MHz)', def: 'Aviation uses VHF frequencies between 118.0 and 136.975 MHz. ATC assigns you specific frequencies to switch to as you move through their airspace. Your radio must be set to the correct frequency to communicate.' },
  'Squawk': { term: 'Transponder Code (Squawk)', def: 'A 4-digit code you enter into your transponder — a radar beacon that tells ATC exactly who you are on their radar screen. ATC assigns you a unique code. "Squawk 4521" means dial in 4521. Special codes: 7700 = emergency, 7600 = lost comms, 7500 = hijacking.' },
  'Altitude': { term: 'Altitude Report', def: 'When checking in with ATC while climbing or descending, say "out of [altitude]" rather than just the number. This tells them you\'re in motion. "Out of one thousand eight hundred" means you\'re passing through 1,800 ft and still climbing.' },
  'Leg': { term: 'Traffic Pattern Leg', def: 'The standard rectangular flight path around an airport for landing. Legs in order: Crosswind (perpendicular after takeoff), Downwind (parallel to runway, opposite direction), Base (perpendicular turning toward runway), Final (aligned with runway for landing).' },
  'Runway': { term: 'Runway Number', def: 'Runways are numbered by their magnetic heading rounded to the nearest 10°, then divided by 10. Runway 27 points roughly 270° (west). The opposite end would be Runway 09 (east). On the radio, say each digit: "runway two seven" not "runway twenty-seven."' },
  'Airport': { term: 'Airport Identifier', def: 'Each airport has a unique code. In the US, towered airports often use 3-letter codes (RDU, JFK, LAX). Ground control is the ATC facility that handles surface movement — you call them after ATIS to get your taxi clearance.' },
  'with information Alpha': { term: 'ATIS / Information Code', def: 'ATIS (Automatic Terminal Information Service) is a recorded loop of current weather, runways in use, and NOTAMs at towered airports. Each recording is labeled with a letter (Alpha, Bravo, Charlie...). Telling ATC you "have information Alpha" confirms you\'ve listened to it and know the current conditions.' },
};


// ── Radio scenario token pools ──────────────────────────────────────────────
const _R_PICK = arr => arr[Math.floor(Math.random() * arr.length)];

const _R_UA = [
  { icao: 'KUZA', name: 'Rock Hill' },
  { icao: 'KSVH', name: 'Statesville' },
  { icao: 'KSPA', name: 'Spartanburg' },
  { icao: 'KTTA', name: 'Sanford' },
  { icao: 'KEQY', name: 'Monroe' },
  { icao: 'KHBI', name: 'Asheboro' },
  { icao: 'KAFP', name: 'Wadesboro' },
  { icao: 'KLBT', name: 'Lumberton' },
  { icao: 'KGMU', name: 'Greenville' },
  { icao: 'KMRN', name: 'Morganton' },
  { icao: 'KJNX', name: 'Smithfield' },
  { icao: 'KLHZ', name: 'Louisburg' },
  { icao: 'KOCW', name: 'Washington' },
  { icao: 'KAIK', name: 'Aiken' },
  { icao: 'KVUJ', name: 'Albemarle' },
  { icao: 'KTBR', name: 'Statesboro' },
  { icao: 'KGVL', name: 'Gainesville' },
];

const _R_CA = [
  { icao: 'KRDU', name: 'RDU', long: 'Raleigh-Durham', ground: 'RDU Ground', tower: 'RDU Tower' },
  { icao: 'KGSO', name: 'Greensboro', long: 'Piedmont Triad', ground: 'Greensboro Ground', tower: 'Greensboro Tower' },
  { icao: 'KGSP', name: 'Greenville', long: 'Greenville-Spartanburg', ground: 'Greenville Ground', tower: 'Greenville Tower' },
  { icao: 'KHKY', name: 'Hickory', long: 'Hickory Regional', ground: 'Hickory Ground', tower: 'Hickory Tower' },
  { icao: 'KFLO', name: 'Florence', long: 'Florence Regional', ground: 'Florence Ground', tower: 'Florence Tower' },
  { icao: 'KINT', name: 'Smith Reynolds', long: 'Smith Reynolds', ground: 'Smith Reynolds Ground', tower: 'Smith Reynolds Tower' },
];

const _R_APP = [
  { name: 'Charlotte Approach', dep: 'Charlotte Departure' },
  { name: 'Raleigh Approach', dep: 'Raleigh Departure' },
  { name: 'Greensboro Approach', dep: 'Greensboro Departure' },
];

const _R_TAILS = [
  { id: 'N4521G', phonetic: 'Cessna Four Five Two One Golf' },
  { id: 'N7382B', phonetic: 'Cessna Seven Three Eight Two Bravo' },
  { id: 'N2846T', phonetic: 'Cessna Two Eight Four Six Tango' },
  { id: 'N5163K', phonetic: 'Cessna Five One Six Three Kilo' },
  { id: 'N9274R', phonetic: 'Cessna Niner Two Seven Four Romeo' },
  { id: 'N3851S', phonetic: 'Cessna Three Eight Five One Sierra' },
];

const _R_RWYS = [
  { num: '4',  spoken: 'zero four' },
  { num: '9',  spoken: 'zero niner' },
  { num: '13', spoken: 'one three' },
  { num: '18', spoken: 'one eight' },
  { num: '22', spoken: 'two two' },
  { num: '27', spoken: 'two seven' },
  { num: '31', spoken: 'three one' },
  { num: '32', spoken: 'three two' },
  { num: '36', spoken: 'three six' },
];

const _R_ATIS_CODES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
const _R_DIRS = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'];
const _R_DIST = ['five', 'eight', 'ten', 'twelve', 'fifteen'];

const _R_CRUISE_ALTS = [
  { ft: 2500, spoken: 'two thousand five hundred' },
  { ft: 3000, spoken: 'three thousand' },
  { ft: 3500, spoken: 'three thousand five hundred' },
  { ft: 4000, spoken: 'four thousand' },
  { ft: 4500, spoken: 'four thousand five hundred' },
];

const _R_CLIMB_ALTS = [
  { ft: 1200, spoken: 'one thousand two hundred' },
  { ft: 1500, spoken: 'one thousand five hundred' },
  { ft: 1800, spoken: 'one thousand eight hundred' },
  { ft: 2100, spoken: 'two thousand one hundred' },
  { ft: 2400, spoken: 'two thousand four hundred' },
];

const _R_POS = ['Signature FBO', 'the FBO', 'transient parking', 'the main ramp', 'Million Air'];
const _R_FF_DEST = ['Raleigh-Durham', 'Charlotte', 'Greenville-Spartanburg', 'Columbia', 'Asheville', 'Myrtle Beach'];

const RADIO_SCENARIOS = [
  // ── CTAF (Uncontrolled) ──────────────────────────────────────────────────────
  {
    type: 'Pattern Entry — Uncontrolled',
    group: 'ctaf',
    build() {
      const ap = _R_PICK(_R_UA);
      const tail = _R_PICK(_R_TAILS);
      const rwy = _R_PICK(_R_RWYS);
      const dist = _R_PICK(_R_DIST);
      const dir = _R_PICK(_R_DIRS);
      const alt = _R_PICK(_R_CRUISE_ALTS);
      return {
        type: this.type, group: this.group,
        situation: `You're inbound to ${ap.name} (${ap.icao}), ${dist} miles ${dir} at ${alt.ft} ft MSL. Uncontrolled field — announce on CTAF.`,
        data: [
          { label: 'Airport', value: ap.name, gloss: null },
          { label: 'Runway', value: rwy.num, gloss: 'Runway' },
          { label: 'Position', value: `${dist} miles ${dir}`, gloss: null },
          { label: 'Altitude', value: `${alt.ft} ft MSL`, gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `${ap.name} traffic, ${tail.phonetic}, ${dist} miles ${dir}, ${alt.spoken}, inbound landing runway ${rwy.spoken}, ${ap.name}.`,
        words: [`${ap.name} traffic`, tail.phonetic, `${dist} miles ${dir}`, alt.spoken, `inbound landing runway ${rwy.spoken}`, ap.name],
        speechOptional: ['landing'],
        distractors: [
          { text: `${ap.name} tower`, why: 'Uncontrolled fields have no tower. Use "traffic" — it addresses all aircraft on the CTAF frequency.' },
          { text: 'with information Golf', why: 'ATIS codes are only reported at towered airports. There\'s no ATIS at an uncontrolled field — don\'t say it.' },
          { text: 'any traffic please advise', why: 'Not standard FAA phraseology — it clutters the frequency and adds no useful information. Self-announce your own position instead.' },
        ],
        rule: { repeats: true, why: 'Uncontrolled field — multiple airports share the same CTAF frequencies. The trailing airport name confirms you and nearby traffic are on the same field.' },
        note: 'Inbound structure: airport + "traffic" → who you are → position → altitude → intentions → airport again. That final repeat confirms you\'re on the right frequency.',
      };
    },
  },
  {
    type: 'Crosswind Call — CTAF',
    group: 'ctaf',
    build() {
      const ap = _R_PICK(_R_UA);
      const tail = _R_PICK(_R_TAILS);
      const rwy = _R_PICK(_R_RWYS);
      return {
        type: this.type, group: this.group,
        situation: `You've turned crosswind departing runway ${rwy.num} at ${ap.name}. Announce your position on CTAF.`,
        data: [
          { label: 'Airport', value: ap.name, gloss: null },
          { label: 'Runway', value: rwy.num, gloss: 'Runway' },
          { label: 'Leg', value: 'Crosswind', gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `${ap.name} traffic, ${tail.phonetic}, crosswind runway ${rwy.spoken}, ${ap.name}.`,
        words: [`${ap.name} traffic`, tail.phonetic, `crosswind runway ${rwy.spoken}`, ap.name],
        distractors: [
          { text: 'turning crosswind', why: 'Announce your position once established on the leg, not while still turning. You say where you are, not what you\'re doing.' },
          { text: `${ap.name} unicom`, why: 'Use "traffic" for position reports — it addresses all aircraft on frequency. "Unicom" is for requesting services like fuel, not self-announcing.' },
          { text: 'departing to the north', why: 'Save the departure call for when you\'re leaving the pattern. On crosswind you\'re still inside the traffic pattern.' },
        ],
        rule: { repeats: true, why: 'Uncontrolled field — bookend every CTAF call with the airport name.' },
        note: 'Crosswind is the first 90-degree turn after departure. Some busy airports skip it, but calling crosswind and downwind helps other traffic sequence in behind you.',
      };
    },
  },
  {
    type: 'Downwind Call — CTAF',
    group: 'ctaf',
    build() {
      const ap = _R_PICK(_R_UA);
      const tail = _R_PICK(_R_TAILS);
      const rwy = _R_PICK(_R_RWYS);
      const lr = _R_PICK(['left', 'right']);
      return {
        type: this.type, group: this.group,
        situation: `You've turned ${lr} downwind for runway ${rwy.num} at ${ap.name}. Announce on CTAF.`,
        data: [
          { label: 'Airport', value: ap.name, gloss: null },
          { label: 'Runway', value: rwy.num, gloss: 'Runway' },
          { label: 'Leg', value: `${lr.charAt(0).toUpperCase() + lr.slice(1)} downwind`, gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `${ap.name} traffic, ${tail.phonetic}, ${lr} downwind runway ${rwy.spoken}, ${ap.name}.`,
        words: [`${ap.name} traffic`, tail.phonetic, `${lr} downwind runway ${rwy.spoken}`, ap.name],
        distractors: [
          { text: 'turning downwind', why: 'Call once you\'re established on downwind, not mid-turn. Announce your position, not the maneuver.' },
          { text: `${ap.name} tower`, why: 'Uncontrolled fields have no tower. Use "traffic" to address all aircraft on CTAF.' },
          { text: 'with the airport in sight', why: 'Implied — don\'t clutter the call. Other traffic needs your position and leg, nothing more.' },
        ],
        rule: { repeats: true, why: 'Uncontrolled field — bookend every CTAF call with the airport name.' },
        note: 'Downwind is the busiest call in the pattern. You can optionally add your intention — "touch-and-go" or "full stop." Other aircraft use your downwind call to sequence behind you.',
      };
    },
  },
  {
    type: 'Base Leg Call — CTAF',
    group: 'ctaf',
    build() {
      const ap = _R_PICK(_R_UA);
      const tail = _R_PICK(_R_TAILS);
      const rwy = _R_PICK(_R_RWYS);
      const lr = _R_PICK(['left', 'right']);
      return {
        type: this.type, group: this.group,
        situation: `You're established on ${lr} base for runway ${rwy.num} at ${ap.name}. Announce on CTAF.`,
        data: [
          { label: 'Airport', value: ap.name, gloss: null },
          { label: 'Runway', value: rwy.num, gloss: 'Runway' },
          { label: 'Leg', value: `${lr.charAt(0).toUpperCase() + lr.slice(1)} base`, gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `${ap.name} traffic, ${tail.phonetic}, ${lr} base runway ${rwy.spoken}, ${ap.name}.`,
        words: [`${ap.name} traffic`, tail.phonetic, `${lr} base runway ${rwy.spoken}`, ap.name],
        distractors: [
          { text: 'turning base', why: 'Announce once established on base, not while still in the turn. Call after the maneuver, not during it.' },
          { text: 'final approach', why: 'You\'re on base, not final. Announcing the wrong leg misleads traffic trying to sequence behind you.' },
          { text: 'souls on board two', why: 'Souls on board is emergency phraseology only — used when declaring a Mayday. Never used in normal pattern calls.' },
        ],
        rule: { repeats: true, why: 'Uncontrolled field — short pattern calls especially need the bookend airport name since other traffic has less context.' },
        note: 'Keep pattern calls concise. Announce each leg. Short final calls are most critical — crosswind and downwind give other traffic time to fit into the sequence.',
      };
    },
  },
  {
    type: 'Final Approach Call — CTAF',
    group: 'ctaf',
    build() {
      const ap = _R_PICK(_R_UA);
      const tail = _R_PICK(_R_TAILS);
      const rwy = _R_PICK(_R_RWYS);
      return {
        type: this.type, group: this.group,
        situation: `You've rolled out on final for runway ${rwy.num} at ${ap.name}. Announce on CTAF.`,
        data: [
          { label: 'Airport', value: ap.name, gloss: null },
          { label: 'Runway', value: rwy.num, gloss: 'Runway' },
          { label: 'Leg', value: 'Final', gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `${ap.name} traffic, ${tail.phonetic}, final runway ${rwy.spoken}, ${ap.name}.`,
        words: [`${ap.name} traffic`, tail.phonetic, `final runway ${rwy.spoken}`, ap.name],
        distractors: [
          { text: 'turning final', why: 'Call once established on final, not while still in the turn. "Turning final" implies you\'re mid-maneuver and not yet aligned with the runway.' },
          { text: 'gear down', why: 'Good internal checklist item, but never part of a radio call. Keep calls to position and intentions only.' },
          { text: 'with the field in sight', why: 'Implied by the call — you wouldn\'t be on final without the runway in sight. Don\'t clutter the transmission.' },
        ],
        rule: { repeats: true, why: 'Uncontrolled field — final is the last advisory other traffic gets before you commit to the runway.' },
        note: 'Final is the most critical pattern call. Departing traffic and other landing aircraft need to know someone is on final before they enter the runway.',
      };
    },
  },
  {
    type: 'Straight-in Approach — CTAF',
    group: 'ctaf',
    build() {
      const ap = _R_PICK(_R_UA);
      const tail = _R_PICK(_R_TAILS);
      const rwy = _R_PICK(_R_RWYS);
      const dist = _R_PICK(_R_DIST);
      return {
        type: this.type, group: this.group,
        situation: `You're ${dist} miles out on a straight-in to runway ${rwy.num} at ${ap.name}. Announce on CTAF.`,
        data: [
          { label: 'Airport', value: ap.name, gloss: null },
          { label: 'Runway', value: rwy.num, gloss: 'Runway' },
          { label: 'Distance', value: `${dist} miles`, gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `${ap.name} traffic, ${tail.phonetic}, ${dist}-mile straight-in runway ${rwy.spoken}, ${ap.name}.`,
        words: [`${ap.name} traffic`, tail.phonetic, `${dist}-mile straight-in runway ${rwy.spoken}`, ap.name],
        distractors: [
          { text: `inbound landing runway ${rwy.spoken}`, why: '"Inbound landing" doesn\'t warn other traffic you\'re bypassing the pattern. "Straight-in" is the specific term — it tells them you\'re going direct to final.' },
          { text: 'final approach', why: 'At several miles out you\'re not on final — you\'re on a straight-in. "Final" implies you\'re close in and committed.' },
          { text: `${dist} miles out`, why: 'Distance alone doesn\'t describe your path. Specify "straight-in" and the runway so pattern traffic knows where you\'ll appear.' },
        ],
        rule: { repeats: true, why: 'Uncontrolled field — straight-ins skip the standard pattern and need extra warning for aircraft already established downwind or base.' },
        note: 'Straight-in approaches bypass the pattern and can conflict with aircraft in the downwind/base sequence. Announce early and monitor CTAF for conflicting traffic.',
      };
    },
  },
  {
    type: 'Go-Around Call — CTAF',
    group: 'ctaf',
    build() {
      const ap = _R_PICK(_R_UA);
      const tail = _R_PICK(_R_TAILS);
      const rwy = _R_PICK(_R_RWYS);
      return {
        type: this.type, group: this.group,
        situation: `You're on short final for runway ${rwy.num} at ${ap.name} and decide to go around. Announce on CTAF.`,
        data: [
          { label: 'Airport', value: ap.name, gloss: null },
          { label: 'Runway', value: rwy.num, gloss: 'Runway' },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `${ap.name} traffic, ${tail.phonetic}, going around runway ${rwy.spoken}, ${ap.name}.`,
        words: [`${ap.name} traffic`, tail.phonetic, `going around runway ${rwy.spoken}`, ap.name],
        distractors: [
          { text: 'missed approach', why: '"Missed approach" is IFR instrument-approach terminology. At a VFR uncontrolled field say "going around" — using IFR phraseology here sounds wrong to other pilots.' },
          { text: 'rejected landing', why: 'Not standard FAA phraseology. "Going around" is the correct and universally understood term for an aborted landing.' },
          { text: 'climbing to pattern altitude', why: 'Keep the go-around call brief — you\'re busy flying. "Going around" and the runway number are all other traffic needs.' },
        ],
        rule: { repeats: true, why: 'Uncontrolled field — other pattern traffic must know you\'re rejoining the pattern rather than landing.' },
        note: 'Make the go-around call as soon as you\'re climbing. Fly the airplane first — the call can be brief. Runway-clear traffic holding to depart must know you\'re coming back around.',
      };
    },
  },
  {
    type: 'Clear of Runway — CTAF',
    group: 'ctaf',
    build() {
      const ap = _R_PICK(_R_UA);
      const tail = _R_PICK(_R_TAILS);
      const rwy = _R_PICK(_R_RWYS);
      return {
        type: this.type, group: this.group,
        situation: `You've just landed and cleared runway ${rwy.num} at ${ap.name}. Make the announcement.`,
        data: [
          { label: 'Airport', value: ap.name, gloss: null },
          { label: 'Runway', value: rwy.num, gloss: 'Runway' },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `${ap.name} traffic, ${tail.phonetic}, clear of runway ${rwy.spoken}, ${ap.name}.`,
        words: [`${ap.name} traffic`, tail.phonetic, `clear of runway ${rwy.spoken}`, ap.name],
        distractors: [
          { text: 'landed', why: '"Landed" doesn\'t tell other traffic whether you\'re still on the runway surface. "Clear of runway" is the explicit release for waiting departure traffic.' },
          { text: 'taxi to parking', why: 'The runway-clear call comes first. Taxi intent is secondary — the priority is releasing the runway to traffic holding for departure.' },
          { text: 'clear', why: '"Clear" alone is ambiguous. Specify "clear of runway" with the runway number so waiting traffic knows which runway is available.' },
        ],
        rule: { repeats: true, why: 'Uncontrolled field — the clear call releases aircraft holding at the hold short line for departure.' },
        note: 'Make the runway-clear call as soon as you\'ve fully exited the runway — before stopping for the after-landing checklist. Others may be holding to depart.',
      };
    },
  },
  {
    type: 'Touch-and-Go Downwind — CTAF',
    group: 'ctaf',
    build() {
      const ap = _R_PICK(_R_UA);
      const tail = _R_PICK(_R_TAILS);
      const rwy = _R_PICK(_R_RWYS);
      const lr = _R_PICK(['left', 'right']);
      return {
        type: this.type, group: this.group,
        situation: `You're doing touch-and-goes at ${ap.name} on runway ${rwy.num}. Announce ${lr} downwind with your intention.`,
        data: [
          { label: 'Airport', value: ap.name, gloss: null },
          { label: 'Runway', value: rwy.num, gloss: 'Runway' },
          { label: 'Leg', value: `${lr.charAt(0).toUpperCase() + lr.slice(1)} downwind`, gloss: null },
          { label: 'Intention', value: 'Touch-and-go', gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `${ap.name} traffic, ${tail.phonetic}, ${lr} downwind runway ${rwy.spoken}, touch-and-go, ${ap.name}.`,
        words: [`${ap.name} traffic`, tail.phonetic, `${lr} downwind runway ${rwy.spoken}`, 'touch-and-go', ap.name],
        distractors: [
          { text: 'full stop', why: 'Full stop means you\'re done for the day. Say "touch-and-go" so other traffic knows you\'re staying in the pattern for another lap.' },
          { text: 'practice approach', why: '"Practice approach" is used for instrument approach training. For VFR pattern work, "touch-and-go" is the correct term.' },
          { text: 'low approach', why: 'A low approach means flying over the runway without touching down. A touch-and-go involves landing then immediately departing.' },
        ],
        rule: { repeats: true, why: 'Uncontrolled field — bookend every CTAF call with the airport name.' },
        note: 'Announcing your intention — touch-and-go, full stop, low approach — lets other traffic sequence around your pattern work. State it on the downwind or base call.',
      };
    },
  },
  {
    type: 'Departing Traffic Pattern — CTAF',
    group: 'ctaf',
    build() {
      const ap = _R_PICK(_R_UA);
      const tail = _R_PICK(_R_TAILS);
      const dir = _R_PICK(_R_DIRS);
      return {
        type: this.type, group: this.group,
        situation: `You're climbing out from ${ap.name} and leaving the traffic pattern to the ${dir}. Announce on CTAF.`,
        data: [
          { label: 'Airport', value: ap.name, gloss: null },
          { label: 'Departure', value: `To the ${dir}`, gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `${ap.name} traffic, ${tail.phonetic}, departing the pattern to the ${dir}, ${ap.name}.`,
        words: [`${ap.name} traffic`, tail.phonetic, `departing the pattern to the ${dir}`, ap.name],
        distractors: [
          { text: 'departing VFR', why: '"VFR" alone doesn\'t tell other traffic where you\'re going. Include the direction so aircraft on crosswind or downwind know where you\'ll exit.' },
          { text: 'leaving the area', why: 'Not standard phraseology. "Departing the pattern" with a direction is the correct call at uncontrolled fields.' },
          { text: 'switching frequencies', why: 'Never announce a frequency change on CTAF — stay on frequency until well clear of the area. Others may need to reach you.' },
        ],
        rule: { repeats: true, why: 'Uncontrolled field — the departure call tells pattern traffic where you\'ll be exiting so they can sequence around you.' },
        note: 'Make the departure call when leaving the pattern — typically after the crosswind or early downwind turn. A direction prevents conflicts with other departing or arriving traffic.',
      };
    },
  },

  // ── Class D (Tower & Ground) ─────────────────────────────────────────────────
  {
    type: 'Initial Callup — Ground Control',
    group: 'class-d',
    build() {
      const ca = _R_PICK(_R_CA);
      const tail = _R_PICK(_R_TAILS);
      const pos = _R_PICK(_R_POS);
      const atis = _R_PICK(_R_ATIS_CODES);
      const dir = _R_PICK(_R_DIRS);
      return {
        type: this.type, group: this.group,
        situation: `You're ready to taxi at ${ca.long} (${ca.icao}). Call ground control for taxi clearance.`,
        data: [
          { label: 'Airport', value: ca.ground, gloss: 'Airport' },
          { label: 'Tail', value: tail.id, gloss: null },
          { label: 'Position', value: pos, gloss: null },
          { label: 'ATIS', value: `Info ${atis}`, gloss: 'with information Alpha' },
          { label: 'Departure', value: `VFR ${dir}`, gloss: null },
        ],
        ideal: `${ca.ground}, ${tail.phonetic}, at ${pos}, with information ${atis}, VFR departure to the ${dir}, request taxi.`,
        words: [ca.ground, tail.phonetic, `at ${pos}`, `with information ${atis}`, `VFR departure to the ${dir}`, 'request taxi'],
        distractors: [
          { text: tail.id, why: 'Use the phonetic callsign — not the raw N-number. "Cessna Four Five Two One Golf" is what ATC expects to hear.' },
          { text: 'request takeoff clearance', why: 'Ground handles taxi only. Tower issues takeoff clearance at the runway threshold — they\'re two different controllers.' },
          { text: 'over', why: '"Over" is not used in aviation radio calls. It\'s a civilian misconception from military and CB radio culture.' },
        ],
        rule: { repeats: false, why: 'Controlled field — the controller knows which airport you\'re at. Repeating the name wastes airtime.' },
        note: 'Ground callup: who you\'re calling → who you are → where you are → ATIS code → departure info → request. Always lead with the facility, not yourself.',
      };
    },
  },
  {
    type: 'Initial Contact — Tower (Ready to Depart)',
    group: 'class-d',
    build() {
      const ca = _R_PICK(_R_CA);
      const tail = _R_PICK(_R_TAILS);
      const rwy = _R_PICK(_R_RWYS);
      return {
        type: this.type, group: this.group,
        situation: `You've taxied to the hold short line at ${ca.long}. Call tower ready for departure on runway ${rwy.num}.`,
        data: [
          { label: 'Facility', value: ca.tower, gloss: null },
          { label: 'Runway', value: rwy.num, gloss: 'Runway' },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `${ca.tower}, ${tail.phonetic}, holding short runway ${rwy.spoken}, ready for takeoff, VFR.`,
        words: [ca.tower, tail.phonetic, `holding short runway ${rwy.spoken}`, 'ready for takeoff', 'VFR'],
        distractors: [
          { text: 'request takeoff clearance', why: 'Say "ready for takeoff" — tower will issue the clearance. Don\'t request the specific clearance by name.' },
          { text: ca.ground, why: 'You\'re talking to tower now, not ground. Calling the wrong facility causes confusion and the controller will redirect you.' },
          { text: tail.id, why: 'Use the phonetic callsign at the tower callup — raw N-numbers are harder to hear and less professional.' },
        ],
        rule: { repeats: false, why: 'Controlled field — tower handles one airport. No trailing name needed.' },
        note: 'Tower callup at the hold short: facility → callsign → which runway → "ready for takeoff" → VFR. Tower will respond with line up and wait or a direct takeoff clearance.',
      };
    },
  },
  {
    type: 'Takeoff Clearance Readback',
    group: 'class-d',
    build() {
      const tail = _R_PICK(_R_TAILS);
      const rwy = _R_PICK(_R_RWYS);
      return {
        type: this.type, group: this.group,
        situation: `Tower says: "${tail.id}, runway ${rwy.num}, cleared for takeoff." Read it back correctly.`,
        data: [
          { label: 'Runway', value: rwy.num, gloss: 'Runway' },
          { label: 'Clearance', value: 'Cleared for takeoff', gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `Runway ${rwy.spoken}, cleared for takeoff, ${tail.phonetic}.`,
        words: [`Runway ${rwy.spoken}`, 'cleared for takeoff', tail.phonetic],
        distractors: [
          { text: 'Roger, cleared for takeoff', why: '"Roger" means received — it\'s not a readback. You must repeat the clearance so ATC can catch any misunderstanding. FAA requires it.' },
          { text: tail.id, why: 'Use the phonetic callsign on readbacks. Raw N-numbers are harder to understand and sound unprofessional.' },
          { text: `Cleared for takeoff runway ${rwy.spoken}`, why: 'Correct content, wrong order. Lead with the runway number — it\'s the safety-critical piece that confirms you heard the right runway.' },
        ],
        rule: { repeats: false, why: 'Controlled field — tower expects a readback of the clearance and runway, not the airport name.' },
        note: 'Readback order: runway → clearance → callsign. Starting with the runway number proves you heard it correctly. FAA requires a full readback of any runway clearance.',
      };
    },
  },
  {
    type: 'Hold Short Readback',
    group: 'class-d',
    build() {
      const tail = _R_PICK(_R_TAILS);
      const rwy = _R_PICK(_R_RWYS);
      return {
        type: this.type, group: this.group,
        situation: `Tower says: "${tail.id}, hold short of runway ${rwy.num}, traffic on final." Read it back.`,
        data: [
          { label: 'Runway', value: rwy.num, gloss: 'Runway' },
          { label: 'Instruction', value: 'Hold short', gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
        ],
        ideal: `Hold short runway ${rwy.spoken}, ${tail.phonetic}.`,
        words: [`Hold short runway ${rwy.spoken}`, tail.phonetic],
        distractors: [
          { text: 'Roger', why: '"Roger" means received — not a readback. FAR 91.129 requires you to read back hold short instructions. This is the most critical readback in ground ops.' },
          { text: 'Wilco', why: '"Wilco" means will comply, but you must also say the runway. Without the runway number, ATC can\'t confirm you heard the right one.' },
          { text: 'Holding short', why: 'Incomplete — always include the runway number. "Holding short" without a runway is insufficient and unsafe.' },
        ],
        rule: { repeats: false, why: 'Controlled field — hold short readbacks are required by FAR 91.129 and are the most safety-critical radio exchange in ground operations.' },
        note: 'Hold short readbacks are mandatory. Include the runway number every time — it\'s what prevents runway incursions. Never reply with just "Roger" or "Wilco."',
      };
    },
  },
  {
    type: 'Initial Contact — Tower (Inbound)',
    group: 'class-d',
    build() {
      const ca = _R_PICK(_R_CA);
      const tail = _R_PICK(_R_TAILS);
      const dist = _R_PICK(_R_DIST);
      const dir = _R_PICK(_R_DIRS);
      const atis = _R_PICK(_R_ATIS_CODES);
      return {
        type: this.type, group: this.group,
        situation: `You're inbound to ${ca.long} (${ca.icao}), ${dist} miles ${dir}, with information ${atis}. First contact with tower.`,
        data: [
          { label: 'Facility', value: ca.tower, gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
          { label: 'Position', value: `${dist} miles ${dir}`, gloss: null },
          { label: 'ATIS', value: `Info ${atis}`, gloss: 'with information Alpha' },
        ],
        ideal: `${ca.tower}, ${tail.phonetic}, ${dist} miles ${dir}, with information ${atis}, request landing.`,
        words: [ca.tower, tail.phonetic, `${dist} miles ${dir}`, `with information ${atis}`, 'request landing'],
        distractors: [
          { text: 'request landing clearance', why: '"Request landing" is correct — don\'t presume the clearance by asking for "landing clearance." ATC will issue it when ready.' },
          { text: 'any traffic please advise', why: 'Never used at controlled airports. Tower manages all traffic — you talk to the controller, not other aircraft.' },
          { text: `${ca.name} traffic`, why: 'Use "tower" not "traffic." At a controlled field you\'re calling a controller, not self-announcing to all aircraft on frequency.' },
        ],
        rule: { repeats: false, why: 'Controlled field — tower handles one airport. No trailing name needed.' },
        note: 'Inbound to Class D: tower → callsign → position → ATIS code → request. ATIS code tells the controller you have current weather — they may issue landing clearance immediately.',
      };
    },
  },

  // ── Approach / En Route ───────────────────────────────────────────────────────
  {
    type: 'Checking In — Approach Control',
    group: 'approach',
    build() {
      const app = _R_PICK(_R_APP);
      const tail = _R_PICK(_R_TAILS);
      const alt = _R_PICK(_R_CLIMB_ALTS);
      return {
        type: this.type, group: this.group,
        situation: `Tower handed you off to ${app.name}. You've switched frequencies and are climbing through ${alt.ft} ft. Check in.`,
        data: [
          { label: 'Facility', value: app.name, gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
          { label: 'Altitude', value: `Climbing through ${alt.ft} ft`, gloss: null },
        ],
        ideal: `${app.name}, ${tail.phonetic}, out of ${alt.spoken}, climbing VFR.`,
        words: [app.name, tail.phonetic, `out of ${alt.spoken}`, 'climbing VFR'],
        distractors: [
          { text: 'squawking 4521', why: 'Don\'t announce your squawk when checking in — approach already sees it on radar. Saying it wastes airtime.' },
          { text: `at ${alt.spoken}`, why: 'Say "out of" when climbing or descending — it signals you\'re in motion. "At" implies you\'re established level at that altitude.' },
          { text: 'request flight following', why: 'Appropriate later — but your first call is just a check-in. Keep it short; approach has other traffic to manage.' },
        ],
        rule: { repeats: false, why: 'Controlled airspace — approach has your squawk on radar and knows your position. No airport name repeat.' },
        note: 'Check-in format: facility → callsign → "out of" altitude → VFR. Four pieces, brief and complete. Use "out of" when climbing or descending, not "at."',
      };
    },
  },
  {
    type: 'Flight Following Request',
    group: 'approach',
    build() {
      const app = _R_PICK(_R_APP);
      const tail = _R_PICK(_R_TAILS);
      const alt = _R_PICK(_R_CRUISE_ALTS);
      const dest = _R_PICK(_R_FF_DEST);
      return {
        type: this.type, group: this.group,
        situation: `You've departed a local airport on a cross-country to ${dest}. Call ${app.name} to request VFR flight following at ${alt.ft} ft.`,
        data: [
          { label: 'Facility', value: app.name, gloss: null },
          { label: 'Tail', value: tail.id, gloss: null },
          { label: 'Altitude', value: `${alt.ft} ft`, gloss: null },
          { label: 'Destination', value: dest, gloss: null },
        ],
        ideal: `${app.name}, ${tail.phonetic}, VFR, ${alt.spoken}, request flight following to ${dest}.`,
        words: [app.name, tail.phonetic, 'VFR', alt.spoken, `request flight following to ${dest}`],
        distractors: [
          { text: 'squawking 1200', why: 'Approach will assign you a discrete squawk — don\'t announce 1200. They\'re going to change it anyway.' },
          { text: 'request IFR clearance', why: 'Flight following is VFR service — you remain VFR and responsible for your own terrain and traffic separation. An IFR clearance is a completely different service.' },
          { text: 'request radar traffic advisories', why: '"Flight following" is what pilots say. "Radar traffic advisories" is the bureaucratic name — using it sounds like you read it from a textbook.' },
        ],
        rule: { repeats: false, why: 'Controlled airspace — approach responds to your callsign directly. No airport name repeat.' },
        note: 'Flight following: facility → callsign → VFR → altitude → destination. Approach will assign a squawk and advise if coverage isn\'t available in your area.',
      };
    },
  },

  // ── Emergency ────────────────────────────────────────────────────────────────
  {
    type: 'Mayday — Engine Failure',
    group: 'emergency',
    build() {
      const tail = _R_PICK(_R_TAILS);
      const ap = _R_PICK(_R_UA);
      const dist = _R_PICK(['two', 'three', 'five', 'eight']);
      const dir = _R_PICK(_R_DIRS);
      const alt = _R_PICK(_R_CRUISE_ALTS);
      return {
        type: this.type, group: this.group,
        situation: `Your engine quits near ${ap.name}. You're at ${alt.ft} ft MSL, one pilot on board. Declare the emergency.`,
        data: [
          { label: 'Tail', value: tail.id, gloss: null },
          { label: 'Emergency', value: 'Engine failure', gloss: null },
          { label: 'Position', value: `${dist} miles ${dir} of ${ap.name}`, gloss: null },
          { label: 'Altitude', value: `${alt.ft} ft MSL`, gloss: null },
          { label: 'Souls', value: '1 on board', gloss: null },
        ],
        ideal: `Mayday, Mayday, Mayday, ${tail.phonetic}, engine failure, ${dist} miles ${dir} of ${ap.name}, ${alt.spoken}, one soul on board.`,
        words: ['Mayday, Mayday, Mayday', tail.phonetic, 'engine failure', `${dist} miles ${dir} of ${ap.name}`, alt.spoken, 'one soul on board'],
        distractors: [
          { text: 'Pan-Pan, Pan-Pan, Pan-Pan', why: 'Pan-Pan is urgency — serious but not immediately life-threatening. Engine failure is a Mayday — you\'re in immediate danger. Use the right word.' },
          { text: 'Emergency, Emergency', why: 'Not the recognized international distress signal. Always say "Mayday, Mayday, Mayday" three times — that\'s what ATC and other pilots are trained to respond to.' },
          { text: 'squawking 7700', why: 'Squawk 7700 on your transponder simultaneously — but don\'t announce it on the radio. You don\'t have airtime to spare. Do both at once.' },
        ],
        rule: { repeats: false, why: 'Emergency frequency — ATC will vector traffic away from you and track your position on radar.' },
        note: 'Mayday structure: Mayday × 3 → callsign → nature → position → altitude → souls on board. Fly the airplane first. Squawk 7700 while you talk — two tasks at once.',
      };
    },
  },
];

const RADIO_SCENARIO_GROUPS = [
  { id: 'ctaf',      label: 'CTAF',      dropdownLabel: 'Uncontrolled (CTAF)',        sub: 'Uncontrolled · Pattern' },
  { id: 'class-d',   label: 'Class D',   dropdownLabel: 'Towered Airport (Class D)',  sub: 'Tower & Ground' },
  { id: 'approach',  label: 'En Route',  dropdownLabel: 'Approach & En Route',        sub: 'Approach & Handoffs' },
  { id: 'emergency', label: 'Emergency', dropdownLabel: 'Emergency (Mayday)',         sub: 'Mayday & Urgency' },
];

const ATIS_AIRPORTS = [
  { id: 'KRDU', name: 'Raleigh-Durham' },
  { id: 'KCLT', name: 'Charlotte Douglas' },
  { id: 'KGSO', name: 'Piedmont Triad' },
  { id: 'KATL', name: 'Atlanta Hartsfield' },
  { id: 'KGSP', name: 'Greenville-Spartanburg' },
];

const ATIS_INFO_CODES = ['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot','Golf','Hotel'];
const RUNWAYS = ['4','9','14','18','22','27','32','36'];
const APPROACHES = ['ILS','VOR','RNAV GPS','Visual'];

const PHONETIC_NUMBERS = {
  '0':'Zero', '1':'Wun', '2':'Too', '3':'Tree',
  '4':'Fower', '5':'Fife', '6':'Six', '7':'Seven', '8':'Ait', '9':'Niner',
};

const PHONETIC_ALPHABET = {
  A:'Alfa',   B:'Bravo',   C:'Charlie', D:'Delta',   E:'Echo',
  F:'Foxtrot',G:'Golf',    H:'Hotel',   I:'India',   J:'Juliett',
  K:'Kilo',   L:'Lima',    M:'Mike',    N:'November',O:'Oscar',
  P:'Papa',   Q:'Quebec',  R:'Romeo',   S:'Sierra',  T:'Tango',
  U:'Uniform',V:'Victor',  W:'Whiskey', X:'X-ray',   Y:'Yankee',
  Z:'Zulu',
};

const VSPEEDS_META = [
  { key: 'vs0', symbol: 'Vs0', label: 'Stall speed, full flaps',
    scenario: 'Full flaps, power idle, wings level — you\'ve slowed to the bottom of the white arc. Below this speed the wing is stalled in landing configuration.',
    prompts: [
      'CFI: "We\'re going to slow to just above the stall, full flaps. What\'s the number at the bottom of the white arc?"',
      'Power back, flaps down, slowing through the pattern — what\'s the minimum speed before the wing quits in this config?',
    ],
  },
  { key: 'vs', symbol: 'Vs', label: 'Stall speed, clean',
    scenario: 'Flaps up, power idle, wings level — you\'ve reached the bottom of the green arc. Below this in clean configuration the wing stops flying.',
    prompts: [
      'CFI: "Flaps up, throttle to idle, hold altitude — note the speed when she buffets."',
      'You\'re demonstrating a power-off stall in clean config. The stall horn sounds just before this speed.',
    ],
  },
  { key: 'vr', symbol: 'Vr', label: 'Rotation speed',
    scenario: 'On the takeoff roll, airspeed climbing — at what speed do you rotate the nose up and lift off?',
    prompts: [
      'You\'re accelerating down the runway. At what airspeed do you apply back pressure and break ground?',
      'CFI: "Airspeed\'s alive — give me a callout when we hit rotation."',
    ],
  },
  { key: 'vx', symbol: 'Vx', label: 'Best angle of climb',
    scenario: 'Trees off the departure end. You need the most altitude gained per foot of ground covered.',
    prompts: [
      'Obstacle departure procedure in effect. Pitch for the steepest climb angle until clear.',
      'CFI: "There\'s a ridge ahead — best angle until we\'re well above it."',
    ],
  },
  { key: 'vy', symbol: 'Vy', label: 'Best rate of climb',
    scenario: 'Departure end clear, no obstacles ahead. You want to reach cruise altitude as fast as possible.',
    prompts: [
      '"N4521G, climb and maintain {alt}, best rate if able."',
      'CFI: "Let\'s get up to {alt} — pitch for best rate."',
      'Clear of the pattern, no traffic conflicts. Get to {alt} as fast as the plane will go.',
    ],
  },
  { key: 'vfe', symbol: 'Vfe', label: 'Max flaps extended',
    scenario: 'Turning downwind to base and ready to slow down and extend flaps. Stay below this speed first.',
    prompts: [
      'You\'re slowing through the pattern and want to extend flaps. What do you confirm first?',
      'CFI: "Check your airspeed against this limit before you touch those flaps."',
    ],
  },
  { key: 'bestGlide', symbol: 'Vg', label: 'Best glide',
    scenario: 'Engine quits. You need to stretch the glide as far as possible to reach a landing spot.',
    prompts: [
      'Prop stops turning over a farm field. You need maximum glide distance to the runway.',
      'CFI: "Engine out — establish best glide immediately. What\'s the speed?"',
    ],
  },
  { key: 'approach', symbol: 'Vapp', label: 'Normal approach',
    scenario: 'Established on final, runway aligned, full flaps. Target this speed all the way to the flare.',
    prompts: [
      'Turning final, runway in sight. What speed do you hold from here to the flare?',
      'CFI: "I want you stabilized by 500 feet AGL — what\'s your target speed on final?"',
    ],
  },
  { key: 'shortFinal', symbol: 'Vref', label: 'Short final',
    scenario: 'Over the numbers at 10 feet, about to flare — this is your crossing-the-threshold target.',
    prompts: [
      'You\'re 50 feet over the threshold. What speed do you want when you begin the flare?',
      'CFI: "What speed do you want crossing the fence?"',
    ],
  },
  { key: 'va', symbol: 'Va', label: 'Maneuvering speed',
    scenario: 'Turbulence ahead. Above this speed a single full control deflection could overstress the airframe. Slow down before it gets rough.',
    prompts: [
      'CFI: "Picking up some chop — let\'s get down to Va before it gets worse."',
      '"Moderate turbulence reported at your altitude." What speed protects the airframe from structural overstress?',
      'You hit a sharp bump that jolts the plane. What speed do you want to be at or below in rough air?',
    ],
  },
  { key: 'vno', symbol: 'Vno', label: 'Max structural cruise',
    scenario: 'Top of the green arc. Above this speed fly only in smooth air — gusts can exceed the load limits even at normal cruise power.',
    prompts: [
      'CFI: "What\'s the top of the green arc — the speed above which you need smooth air?"',
      'You\'re cruising above this speed when the ATIS reports moderate turbulence en route. What do you do first?',
    ],
  },
  { key: 'vne', symbol: 'Vne', label: 'Never-exceed speed',
    scenario: 'The red line on the airspeed indicator. Structural failure is possible above this speed under any conditions.',
    prompts: [
      'CFI: "What does the red line on the airspeed indicator represent?"',
      'Nose-low unusual attitude recovery — you\'re accelerating fast. What speed must you not pass before pulling out?',
    ],
  },
];

if (typeof module !== 'undefined') module.exports = { ALL_AIRCRAFT, RADIO_SCENARIOS, RADIO_SCENARIO_GROUPS, PHONETIC_ALPHABET, PHONETIC_NUMBERS, VSPEEDS_META };
