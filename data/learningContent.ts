
import { LearningModule } from '../types';

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: 'mod1',
    title: '1. Tunnel Engineering Fundamentals',
    requiredXP: 0,
    chapters: [
      {
        title: '1.1 The Arch Effect',
        content: `
          <p class="mb-4">Why are most deep tunnels circular? It's not just for aesthetics—it's about how forces flow through the structure.</p>
          <h4 class="text-lg font-bold mb-2">Stress Redistribution</h4>
          <p class="mb-4">When a tunnel is excavated, the ground tries to move into the void. In a circular tunnel, this radial pressure creates <strong>hoop stress</strong> (compression) in the lining. Concrete is incredibly strong in compression but weak in tension.</p>
          <p class="mb-4">This allows circular tunnels to support immense overburden pressures without needing internal bracing, acting much like a Roman arch buried underground.</p>
          <div class="bg-blue-50 p-4 border-l-4 border-blue-500 my-4">
            <strong>Key Concept:</strong> The deeper the tunnel, the more critical the circular shape becomes to maintain compressive forces.
          </div>
        `
      },
      {
        title: '1.2 Ground Classification',
        content: `
          <p class="mb-4">Before digging, engineers must classify the ground. The most common system is the <strong>Q-system</strong> or <strong>RMR (Rock Mass Rating)</strong>.</p>
          <ul class="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Competent Rock:</strong> Self-supporting, requires minimal bolting.</li>
            <li><strong>Squeezing Ground:</strong> Under high pressure, rock behaves like a plastic fluid, slowly closing the tunnel over time.</li>
            <li><strong>Running Ground:</strong> Loose sand or gravel that flows like water when unsupported.</li>
          </ul>
        `
      }
    ],
    quiz: [
      { id: 'q1-1', type: 'Concept', question: 'What implies the "Arch Effect" in tunneling?', answer: 'The redistribution of ground forces around the excavation into compressive hoop stresses.' },
      { id: 'q1-2', type: 'Definition', question: 'What is "Running Ground"?', answer: 'Loose soil (sand/gravel) that flows like a fluid when unsupported.' },
      { id: 'q1-3', type: 'Concept', question: 'Why is concrete ideal for tunnel linings?', answer: 'It has extremely high compressive strength, matching the hoop stresses in circular tunnels.' }
    ]
  },
  {
    id: 'mod2',
    title: '2. TBM Technology',
    requiredXP: 50,
    chapters: [
      {
        title: '2.1 How a TBM Works',
        content: `
          <p class="mb-4">A Tunnel Boring Machine (TBM) is a moving factory. It performs three simultaneous functions:</p>
          <ol class="list-decimal pl-6 space-y-2 mb-4">
            <li><strong>Excavation:</strong> The cutterhead rotates, pressing disc cutters into the rock to chip it away.</li>
            <li><strong>Support:</strong> It erects precast concrete segments to form a ring immediately behind the shield.</li>
            <li><strong>Propulsion:</strong> Hydraulic jacks push off the previously installed ring to move the machine forward.</li>
          </ol>
        `
      },
      {
        title: '2.2 Segmental Lining',
        content: `
          <p class="mb-4">TBM tunnels are lined with precast concrete rings. A typical ring consists of:</p>
          <ul class="list-disc pl-6 space-y-2 mb-4">
            <li><strong>5-7 Ordinary Segments:</strong> The main structural blocks.</li>
            <li><strong>1 Key Segment:</strong> A wedge-shaped piece inserted last to lock the ring in place.</li>
          </ul>
          <p>These segments are bolted together and sealed with gaskets to prevent water ingress.</p>
        `
      }
    ],
    quiz: [
        { id: 'q2-1', type: 'Definition', question: 'What is the "Key Segment"?', answer: 'The final wedge-shaped segment inserted to lock the lining ring in place.' },
        { id: 'q2-2', type: 'Concept', question: 'How does a TBM move forward?', answer: 'By pushing off the previously installed concrete rings using hydraulic jacks.' }
    ]
  },
  {
    id: 'mod3',
    title: '3. NATM / SCL',
    requiredXP: 150,
    chapters: [
      {
        title: '3.1 Principles of NATM',
        content: `
          <p class="mb-4">The New Austrian Tunneling Method (NATM), also called Sprayed Concrete Lining (SCL), treats the ground itself as a supporting component.</p>
          <p class="mb-4">Instead of a rigid TBM shield, NATM allows controlled deformation of the rock. This movement mobilizes the shear strength of the ground, helping it support itself.</p>
        `
      },
      {
        title: '3.2 Support Elements',
        content: `
          <p class="mb-4">NATM relies on a "sequential" support approach:</p>
          <ul class="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Shotcrete:</strong> Concrete sprayed at high velocity to seal the surface immediately.</li>
            <li><strong>Rock Bolts:</strong> Steel rods drilled 3-6m into the rock to "knit" the outer loose zone to the stable inner core.</li>
            <li><strong>Lattice Girders:</strong> Lightweight steel arches used to define the tunnel shape before shotcreting.</li>
          </ul>
        `
      }
    ],
    quiz: [
        { id: 'q3-1', type: 'Concept', question: 'What is the core philosophy of NATM?', answer: 'Controlled deformation to mobilize the ground\'s own shear strength.' },
        { id: 'q3-2', type: 'Definition', question: 'What are Rock Bolts used for?', answer: 'To anchor the unstable outer rock zone to the stable inner rock core.' }
    ]
  },
  {
    id: 'case_studies',
    title: '4. Real World Case Studies',
    requiredXP: 300,
    chapters: [
      {
        title: 'Gotthard Base Tunnel (Switzerland)',
        link: 'https://en.wikipedia.org/wiki/Gotthard_Base_Tunnel',
        content: `
          <h4 class="text-lg font-bold mb-2">The World's Longest Tunnel (57 km)</h4>
          <p class="mb-4">Opened in 2016, this rail tunnel cuts through the base of the Alps. It reduces travel time between Zurich and Milan significantly.</p>
          
          <h5 class="font-semibold mt-4">Engineering Challenges:</h5>
          <ul class="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Extreme Depth:</strong> Up to 2,300m of rock overburden, creating immense pressure and temperatures up to 46°C.</li>
            <li><strong>Piora Syncline:</strong> A feared zone of sugar-like dolomite under high water pressure.</li>
          </ul>
          
          <h5 class="font-semibold mt-4">Method:</h5>
          <p class="mb-4">Four TBMs were used simultaneously, along with drill-and-blast methods for complex crossovers.</p>
        `
      },
      {
        title: 'Channel Tunnel (UK - France)',
        link: 'https://en.wikipedia.org/wiki/Channel_Tunnel',
        content: `
          <h4 class="text-lg font-bold mb-2">The Undersea Connection (50 km)</h4>
          <p class="mb-4">Completed in 1994, it consists of three tubes: two rail tunnels and a central service tunnel.</p>
          
          <h5 class="font-semibold mt-4">Geology is Destiny:</h5>
          <p class="mb-4">The tunnel route followed the <strong>Chalk Marl</strong> layer—a soft, impermeable rock ideal for TBM tunneling. The engineers had to stay within this specific stratum while navigating beneath the sea.</p>
          
          <h5 class="font-semibold mt-4">Innovation:</h5>
          <p class="mb-4">The TBMs from the UK side were buried under the tunnel floor when they met the French TBMs, as it was too expensive to reverse them out.</p>
        `
      }
    ]
  },
  {
    id: 'mod5',
    title: '5. Advanced 3D Analysis',
    requiredXP: 500,
    chapters: [
      {
        title: '5.1 One Ecosystem, One Workflow',
        content: `
          <p class="mb-4">Modern tunnel analysis connects field data with 3D kinematic analysis. This allows engineers to import precise as-built geometries directly into modelling environments to forecast block failures.</p>
        `
      },
      {
        title: '5.2 Kinematic Analysis',
        content: `
          <p class="mb-4">Software calculates the intersection of joints with the excavation surface to identify <strong>removable blocks</strong>. If a block's Factor of Safety is < 1.3, it is marked as "failed".</p>
        `
      }
    ]
  },
  {
    id: 'mod9',
    title: '9. Ground Reinforcement Methods',
    requiredXP: 700,
    chapters: [
      {
        title: '9.1 Grouting Techniques',
        content: `
          <p class="mb-4">When ground is too weak or permeable, we treat it before excavating.</p>
          <h4 class="text-lg font-bold mb-2">Permeation vs. Jet Grouting</h4>
          <ul class="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Permeation Grouting:</strong> Injecting low-viscosity fluids (chemical or cement) into soil pores without disturbing the structure. Best for sands.</li>
            <li><strong>Jet Grouting:</strong> using a high-pressure jet (400+ bar) to destroy the soil structure and mix it with grout, creating "soilcrete" columns.</li>
          </ul>
        `
      },
      {
        title: '9.2 Ground Freezing',
        content: `
          <p class="mb-4">For water-logged soils where grouting fails, <strong>Artificial Ground Freezing (AGF)</strong> is the ultimate solution. Brine (-30°C) or Liquid Nitrogen (-196°C) is circulated through pipes, turning groundwater into structural ice walls. It is temporary but extremely reliable.</p>
        `
      }
    ],
    quiz: [
      { id: 'q9-1', type: 'Definition', question: 'What is Jet Grouting?', answer: 'Using high-pressure jets to erode soil and mix it with cement to form soilcrete.' },
      { id: 'q9-2', type: 'Concept', question: 'When is Ground Freezing typically used?', answer: 'In water-logged, unstable soils where traditional grouting is ineffective.' }
    ]
  },
  {
    id: 'mod10',
    title: '10. Structural Lining Analysis',
    requiredXP: 1000,
    chapters: [
        {
            title: '10.1 Convergence-Confinement Method (CCM)',
            content: `
                <p class="mb-4">The <strong>Convergence-Confinement Method (CCM)</strong> is the cornerstone of modern tunnel design, particularly for NATM. It analyzes the interplay between the relaxing rock mass and the installed support system.</p>
                
                <h4 class="text-lg font-bold mb-2 text-slate-700">The Core Concept</h4>
                <p class="mb-4">When a tunnel is excavated, the rock mass naturally relaxes and moves inward (convergence). This movement mobilizes the inherent shear strength of the ground (arching effect). If the support is installed too early (stiff support), it attracts excessive load. If installed too late, the ground may loosen excessively and collapse.</p>
                
                <div class="my-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                    <h5 class="text-center font-bold text-slate-600 mb-4 text-sm uppercase tracking-widest">Interaction Diagram</h5>
                    <svg viewBox="0 0 500 350" class="w-full h-auto drop-shadow-md bg-white rounded-xl p-2">
                        <!-- Definitions -->
                        <defs>
                            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
                            </marker>
                        </defs>

                        <!-- Grid -->
                        <path d="M 50 50 L 50 300 L 450 300" fill="none" stroke="#e2e8f0" stroke-width="2" />
                        
                        <!-- Axes Labels -->
                        <text x="250" y="340" text-anchor="middle" font-size="14" fill="#64748b" font-weight="bold">Radial Displacement (u)</text>
                        <text x="30" y="180" text-anchor="middle" transform="rotate(-90 30 180)" font-size="14" fill="#64748b" font-weight="bold">Support Pressure (Pi)</text>

                        <!-- Ground Reaction Curve (GRC) -->
                        <path d="M 50 50 Q 200 50 250 150 T 450 280" fill="none" stroke="#3b82f6" stroke-width="4" />
                        <text x="60" y="60" font-size="12" fill="#3b82f6" font-weight="bold">Ground Reaction Curve (GRC)</text>
                        <text x="60" y="75" font-size="10" fill="#64748b">In-situ Stress (P₀)</text>

                        <!-- Support Characteristic Curve (SCC) -->
                        <path d="M 150 300 L 320 180" fill="none" stroke="#10b981" stroke-width="4" stroke-dasharray="8,4" />
                        <text x="330" y="175" font-size="12" fill="#10b981" font-weight="bold">Support Curve (SCC)</text>
                        
                        <!-- Equilibrium Point -->
                        <circle cx="272" cy="214" r="8" fill="#ef4444" stroke="white" stroke-width="2" />
                        <text x="285" y="220" font-size="12" fill="#ef4444" font-weight="bold">Equilibrium Point</text>

                        <!-- Annotations -->
                        <line x1="150" y1="300" x2="150" y2="310" stroke="#94a3b8" stroke-width="2" />
                        <text x="150" y="325" text-anchor="middle" font-size="10" fill="#64748b">Install Support</text>

                        <line x1="272" y1="214" x2="272" y2="300" stroke="#ef4444" stroke-width="1" stroke-dasharray="2,2" />
                        <line x1="272" y1="214" x2="50" y2="214" stroke="#ef4444" stroke-width="1" stroke-dasharray="2,2" />
                    </svg>
                </div>

                <h4 class="text-lg font-bold mb-2 text-slate-700">The 3 Components</h4>
                <ol class="list-decimal pl-6 space-y-4 mb-4 marker:text-blue-600 marker:font-bold">
                    <li>
                        <strong>Ground Reaction Curve (GRC):</strong> 
                        This curve starts at the in-situ stress ($P_0$). As the tunnel converges ($u$ increases), the required support pressure decreases because the rock creates a self-supporting arch. However, if displacement exceeds a critical limit, the rock behaves plastically and pressure increases again due to loosening.
                    </li>
                    <li>
                        <strong>Support Characteristic Curve (SCC):</strong> 
                        This represents the stiffness of the lining (shotcrete/steel sets). It only starts <em>after</em> installation. Since support cannot be installed instantly at the face (displacement $u=0$), it always starts at some initial displacement ($u_{in}$).
                    </li>
                    <li>
                        <strong>Equilibrium:</strong> 
                        Design safety is achieved when the SCC intersects the GRC in the stable elastic-plastic zone. The Factor of Safety is defined by the capacity of the lining versus the load at this intersection.
                    </li>
                </ol>
            `
        },
        {
            title: '10.2 Thrust and Moment',
            content: `
                <p class="mb-4">Once the equilibrium load is determined from CCM, the lining segments must be designed to withstand structural forces.</p>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-blue-50 p-4 rounded-xl">
                        <h5 class="font-bold text-blue-700 mb-1">Hoop Thrust (N)</h5>
                        <p class="text-xs text-blue-900">The primary compressive force acting circumferentially around the ring. Derived from $P_{eq} \times Radius$.</p>
                    </div>
                    <div class="bg-orange-50 p-4 rounded-xl">
                        <h5 class="font-bold text-orange-700 mb-1">Bending Moment (M)</h5>
                        <p class="text-xs text-orange-900">Induced by non-uniform loading (e.g., $K_0 \\neq 1$) or shape imperfections (ovalization).</p>
                    </div>
                </div>
                <h4 class="text-lg font-bold mb-2 text-slate-700">The Capacity Interaction Diagram (M-N)</h4>
                <p class="mb-4">Reinforced concrete sections are checked using an M-N interaction diagram. The combination of Thrust and Moment must fall within the "onion" shape envelope defined by the concrete crushing limit and steel yield limit.</p>
                <p class="mb-4 font-mono text-sm bg-slate-800 text-white p-2 rounded">Eccentricity (e) = M / N &lt; h/6</p>
                <p class="text-sm text-slate-500">Ideally, the eccentricity should remain within the middle third of the section thickness ($h$) to avoid tensile cracking.</p>
            `
        }
    ],
    quiz: [
        { id: 'q10-1', type: 'Concept', question: 'In CCM, what happens if support is installed too early?', answer: 'The support acts too stiffly and attracts excessive load, potentially exceeding its structural capacity.' },
        { id: 'q10-2', type: 'Definition', question: 'What is the Equilibrium Point in CCM?', answer: 'The intersection of the Ground Reaction Curve (GRC) and the Support Characteristic Curve (SCC).' },
        { id: 'q10-3', type: 'Concept', question: 'Why does the GRC curve initially go down?', answer: 'Because small displacements allow the rock to mobilize its own shear strength (arching), reducing the load on the support.' }
    ]
  }
];
