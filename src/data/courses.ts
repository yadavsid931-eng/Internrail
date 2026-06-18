import { Course, MCQQuestion } from '../types';

export const INITIAL_COURSES: Course[] = [
  {
    id: 'aaws',
    title: 'Advanced Auxiliary Warning System',
    shortTitle: 'AAWS',
    description: 'Automatic cab-signaling and train speed control system designed to prevent signal passing at danger (SPAD).',
    longDescription: 'The Advanced Auxiliary Warning System (AAWS) is a critical train protection technology. It transmits signal aspects from track to locomotive cab, warns the driver of upcoming restrictive signals, and automatically applies emergency brakes if the warning is unacknowledged or speed limits are violated.',
    duration: '2.5 Hours',
    icon: 'RadioReceiver',
    color: '#3b82f6', // blue
    passingScore: 80,
    imageUrl: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?w=600&auto=format&fit=crop&q=60',
    videos: [
      {
        id: 'vid-aaws-1',
        courseId: 'aaws',
        title: 'Introduction to AAWS Safety and Architecture',
        description: 'Understand the fundamental safety principles, track-side magnets/balises, and on-board receiver equipment. Covers cab interface devices and audio-visual alert alarms.',
        url: 'https://www.youtube.com/embed/S7oXIn_t38c', // Interactive educational Train Control/Safety simulation video
        duration: '12:30',
        durationSeconds: 750,
        mandatory: true,
        order: 1,
        category: 'Safety Systems',
        aspectRatio: '16:9'
      },
      {
        id: 'vid-aaws-2',
        courseId: 'aaws',
        title: 'Trackside-Locomotive Magnet Synchronization',
        description: 'Advanced engineering explanation of inductive coupling and magnetic resonance loops used to bridge signals to the CPU.',
        url: 'https://www.youtube.com/embed/5F_f3M-V748',
        duration: '08:45',
        durationSeconds: 525,
        mandatory: true,
        order: 2,
        category: 'Hardware Operations',
        aspectRatio: '21:9'
      }
    ]
  },
  {
    id: 'pis',
    title: 'Passenger Information System',
    shortTitle: 'PIS',
    description: 'An automated electronic system providing real-time scheduling updates and emergency warnings to passengers.',
    longDescription: 'The Passenger Information System (PIS) coordinates internal and external LED displays, GPS-tracked route maps, and synthesized voice announcements across multiple coaches to keep passengers informed and safe.',
    duration: '1.5 Hours',
    icon: 'Tv',
    color: '#a855f7', // purple
    passingScore: 75,
    imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&auto=format&fit=crop&q=60',
    videos: [
      {
        id: 'vid-pis-1',
        courseId: 'pis',
        title: 'GPS Synchronization & Route Master Server',
        description: 'Deep dive into standard GPS telemetry tracking, geofenced announcement triggers, and central routing databases.',
        url: 'https://www.youtube.com/embed/bep7F_R47w8',
        duration: '10:15',
        durationSeconds: 615,
        mandatory: true,
        order: 1,
        category: 'Networking',
        aspectRatio: '16:9'
      }
    ]
  },
  {
    id: 'apc',
    title: 'Automatic Phase Changer',
    shortTitle: 'APC',
    description: 'Optimizes locomotive power transition across neutral zones of overhead high-voltage traction lanes.',
    longDescription: 'The Automatic Phase Changer (APC) detects neutral section magnets on OHE trackers and automatically trips the vacuum circuit breaker to protect the high-tension transformers, closing the breaker safely on exit.',
    duration: '3.0 Hours',
    icon: 'Zap',
    color: '#ef4444', // red
    passingScore: 80,
    imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&auto=format&fit=crop&q=60',
    videos: [
      {
        id: 'vid-apc-1',
        courseId: 'apc',
        title: 'Overhead Line Neutral Sections and Breaker Tripping',
        description: 'Overview of the main electrical phases, OHE structure, and the critical need to switch power phases safely during high speeds.',
        url: 'https://www.youtube.com/embed/u1Q_q5A8Pxs',
        duration: '15:20',
        durationSeconds: 920,
        mandatory: true,
        order: 1,
        category: 'Heavy Electricals',
        aspectRatio: '16:9'
      }
    ]
  },
  {
    id: 'cvvrs',
    title: 'Crew Voice and Video Recording System',
    shortTitle: 'CVVRS',
    description: 'Comprehensive train cab monitoring and event logging, acting as a flight-recorder black box for railways.',
    longDescription: 'CVVRS captures multi-angle HD video logs of driver panels, tracks crew facial cues for alertness, and logs internal cabin acoustics to ensure maximum operating safety and post-incident investigation accuracy.',
    duration: '2.0 Hours',
    icon: 'Video',
    color: '#10b981', // green
    passingScore: 70,
    imageUrl: 'https://images.unsplash.com/photo-1517482713634-19687d00d2eb?w=600&auto=format&fit=crop&q=60',
    videos: [
      {
        id: 'vid-cvvrs-1',
        courseId: 'cvvrs',
        title: 'Cab Video Recording & Crash-Proof Storage Enclosures',
        description: 'Analysis of IP-cameras, night-vision sensors, localized storage partitions, thermal rating layers, and telemetry indexing.',
        url: 'https://www.youtube.com/embed/yofS60xX-bE',
        duration: '11:40',
        durationSeconds: 700,
        mandatory: true,
        order: 1,
        category: 'Diagnostics',
        aspectRatio: '16:9'
      }
    ]
  },
  {
    id: 'etbu',
    title: 'Emergency Talk Back Unit',
    shortTitle: 'ETBU',
    description: 'Critical communication gateway allowing rapid passengers-to-driver intercom support in coaches.',
    longDescription: 'The Emergency Talk Back Unit (ETBU) ensures double-isolated, dynamic noise-cancelling communication pathways. It is connected directly over a redundant train-bus backbone to prevent failure in low pressure, derailments, or fire.',
    duration: '1.2 Hours',
    icon: 'PhoneCall',
    color: '#eab308', // orange
    passingScore: 80,
    imageUrl: 'https://images.unsplash.com/photo-1557568192-2afc8354308a?w=600&auto=format&fit=crop&q=60',
    videos: [
      {
        id: 'vid-etbu-1',
        courseId: 'etbu',
        title: 'ETBU Audio Loop and Hardware Comm Backbones',
        description: 'Understanding RS-485 bus backbones, acoustic cancellation, physical call buttons, and manual override indicators.',
        url: 'https://www.youtube.com/embed/5m6x04R6BcA',
        duration: '09:12',
        durationSeconds: 552,
        mandatory: true,
        order: 1,
        category: 'Intercoms',
        aspectRatio: '9:16' // Vertical test video!
      }
    ]
  }
];

export const INITIAL_MCQS: MCQQuestion[] = [
  // AAWS questions
  {
    id: 'q-aaws-1',
    courseId: 'aaws',
    question: 'What is the primary function of the Advanced Auxiliary Warning System (AAWS)?',
    options: [
      'To control train speed automatically and prevent signal passing at danger (SPAD)',
      'To alert crew and passengers of potential hazards',
      'To manage passenger boarding times in central coaches',
      'To monitor engine performance temperatures and engine oils'
    ],
    correctAnswer: 0,
    explanation: 'The primary purpose of AAWS is automatic train speed monitoring, signal transmission to the cab, and automatic enforcement/braking to prevent SPAD.',
    marks: 5,
    difficulty: 'Easy'
  },
  {
    id: 'q-aaws-2',
    courseId: 'aaws',
    question: 'What happens if a train driver encounters an upcoming restrictive yellow signal but does not press the acknowledgement button within the specified window?',
    options: [
      'The train goes into reverse automatically',
      'The signal turns green automatically',
      'An audio alert continues to play without active speed limits',
      'The AAWS system automatically applies emergency brakes'
    ],
    correctAnswer: 3,
    explanation: 'Failure to acknowledge restrictive signals will trigger the fail-safe security protocol, resulting in automatic emergency application of brakes.',
    marks: 5,
    difficulty: 'Medium'
  },
  {
    id: 'q-aaws-3',
    courseId: 'aaws',
    question: 'Which device is installed on the track bed to transmit signal indications up to the locomotive cab receiver coils?',
    options: [
      'Pneumatic compression nodes',
      'Track-side balises / active warning magnets',
      'Ultrasonic overhead switches',
      'Mechanical lever gates'
    ],
    correctAnswer: 1,
    explanation: 'Electromagnetic balises or warning magnets on the track bed couple inductively with the receiver mounted on the locomotive to transfer status securely.',
    marks: 5,
    difficulty: 'Hard'
  },

  // PIS questions
  {
    id: 'q-pis-1',
    courseId: 'pis',
    question: 'By what primary mechanism does the modern Passenger Information System keep track of geographic location to trigger automated voice announcements?',
    options: [
      'Manual log updates entered by the train attendants',
      'Localized barcode stickers inside the tunnels',
      'Integrated GPS telemetry matched with geofenced coordinates',
      'Mechanical wheel-rotation counters and timer clocks'
    ],
    correctAnswer: 2,
    explanation: 'PIS uses satellite-based GPS location tracking cross-referenced with pre-programmed geofenced coordinates to play zone announcements automatically.',
    marks: 5,
    difficulty: 'Medium'
  },
  {
    id: 'q-pis-2',
    courseId: 'pis',
    question: 'What communication standard is commonly specified for distributing audio signals reliably in real-time across multiple train coaches?',
    options: [
      'Single twisted-pair ethernet or redundant CAN-bus line',
      'Direct analog speaker wirings without any amplification',
      'Encrypted infrared beam pointers',
      'Symmetric dial-up phone lines'
    ],
    correctAnswer: 0,
    explanation: 'Industrial networks like CAN-bus or industrial-grade ethernet are utilized to transmit low-latency compressed digital audio messages across long train segments.',
    marks: 5,
    difficulty: 'Hard'
  },

  // APC questions
  {
    id: 'q-apc-1',
    courseId: 'apc',
    question: 'What is a "Neutral Section" in high-voltage railway overhead equipment (OHE) structures?',
    options: [
      'A platform where no passenger trains are safely permitted',
      'An insulated dead-zone separating two neighboring high-voltage power grids/feeding posts',
      'A maintenance yard for checking general locomotive equipment',
      'A ground terminal to release static charges from the train roof'
    ],
    correctAnswer: 1,
    explanation: 'A neutral section is an unenergized/insulated contact line separating two adjacent electricity substations, preventing short-circuiting between different phases.',
    marks: 5,
    difficulty: 'Medium'
  },
  {
    id: 'q-apc-2',
    courseId: 'apc',
    question: 'The Automatic Phase Changer (APC) commands which on-board heavy electrical switch to break flow before enters a neutral zone?',
    options: [
      'Primary auxiliary alternator shunt relay',
      'Dynamic braking resistor grids',
      'The Vacuum Circuit Breaker (VCB) or main transformer switcher',
      'The manual cab power key switch'
    ],
    correctAnswer: 2,
    explanation: 'The APC detects upcoming magnets on course and trips the Vacuum Circuit Breaker (VCB) instantly, avoiding arching damage to OHE lines and the power collectors.',
    marks: 5,
    difficulty: 'Hard'
  },

  // CVVRS questions
  {
    id: 'q-cvvrs-1',
    courseId: 'cvvrs',
    question: 'In addition to track video recordings, which human biometric feedback cue does CVVRS analyze to assess safety risks?',
    options: [
      'Grip strength measurements on the emergency brake handle',
      'Driver alertness levels and sleep/distraction indicators through face tracking',
      'Heart pulsation telemetry via wireless seat cushions',
      'Direct body weight measurements'
    ],
    correctAnswer: 1,
    explanation: 'AI-assisted state modules in CVVRS detect driver micro-sleeps, distraction patterns, and gaze redirection via localized cameras facing the driver bench.',
    marks: 10,
    difficulty: 'Easy'
  },
  {
    id: 'q-cvvrs-2',
    courseId: 'cvvrs',
    question: 'Where are the digital recordings of CVVRS kept to ensure they survive critical structural incidents or high-temperature impacts?',
    options: [
      'In a plastic USB thumb-drive inside the cabinet console',
      'Directly on the clouds without any back-ups on land',
      'In crash-proof, hermetically-insulated recording enclosures (black boxes)',
      'Under the driver seat inside card boxes'
    ],
    correctAnswer: 2,
    explanation: 'Just like aviation recorders, modern railway CVVRS records are stored in armored modules certified to resist crash impacts, crushing forces, and fire.',
    marks: 10,
    difficulty: 'Medium'
  },

  // ETBU questions
  {
    id: 'q-etbu-1',
    courseId: 'etbu',
    question: 'What is the function of the Emergency Talk Back Unit (ETBU) located inside passenger compartments?',
    options: [
      'To download localized high-speed multimedia files for entertainment',
      'To make phone calls to commercial booking agents',
      'To establish direct, clear audio contact between passengers and the train driver/guard during emergencies',
      'To broadcast general news and weather reports inside the dynamic cabin'
    ],
    correctAnswer: 2,
    explanation: 'ETBU lets passengers trigger localized panic calls and directly speak to the train operators with noise-suppression processing, avoiding panic and enabling fast response.',
    marks: 10,
    difficulty: 'Easy'
  }
];
