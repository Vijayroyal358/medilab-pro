export interface CatalogTest {
  name: string;
  price: number;
  category: string;
  revenue_share?: number;
  gender?: "Both" | "Male" | "Female";
  active?: boolean;
  entry_type?: "Test" | "Package" | "Panel" | "Bill only";
}

export const DEFAULT_TESTS_DATABASE: Record<string, CatalogTest[]> = {
  LAB: [
    { name: "ABC", price: 100, category: "Biochemistry", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" },
    { name: "AEC", price: 100, category: "Hematology", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" },
    { name: "AFB", price: 100, category: "Microbiology", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" },
    { name: "AFP", price: 100, category: "Serology", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" },
    { name: "A/G Ratio", price: 100, category: "Biochemistry", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" },
    { name: "AMH", price: 100, category: "Biochemistry", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" },
    { name: "AMH Panel", price: 100, category: "Biochemistry", revenue_share: 0, gender: "Both", active: true, entry_type: "Panel" },
    { name: "Ammonia", price: 100, category: "Biochemistry", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" },
    { name: "Anemia package", price: 100, category: "Pathology", revenue_share: 0, gender: "Both", active: true, entry_type: "Package" },
    { name: "Antenatal Package", price: 100, category: "Pathology", revenue_share: 0, gender: "Female", active: true, entry_type: "Package" }
  ],
  USG: [
    { name: "USG Abdomen Plain", price: 1000, category: "USG", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" },
    { name: "USG Pelvis Plain", price: 800, category: "USG", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" },
    { name: "USG Obstetric Scan", price: 1200, category: "USG", revenue_share: 0, gender: "Female", active: true, entry_type: "Test" }
  ],
  "DIGITAL XRAY": [
    { name: "Chest X-Ray PA View", price: 400, category: "Digital X-Ray", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" }
  ],
  XRAY: [
    { name: "Chest X-Ray Plain PA", price: 300, category: "Plain X-Ray", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" }
  ],
  "OUTSOURCE LAB": [
    { name: "Biopsy Pathology Small", price: 1500, category: "Histology", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" }
  ],
  ECG: [
    { name: "12-Lead ECG", price: 300, category: "Cardiology", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" }
  ],
  "CT SCAN": [
    { name: "CT Brain Plain", price: 2000, category: "CT Scan", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" }
  ],
  MRI: [
    { name: "Brain MRI Plain", price: 5000, category: "MRI", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" }
  ],
  EPS: [
    { name: "EPS Study (Basic)", price: 12000, category: "Electrophysiology", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" }
  ],
  OPG: [
    { name: "OPG Dental Panoramic", price: 600, category: "Dental", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" }
  ],
  CARDIOLOGY: [
    { name: "2D Echocardiography", price: 2000, category: "Cardiology", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" }
  ],
  EEG: [
    { name: "Routine EEG (30 Min)", price: 1500, category: "EEG", revenue_share: 0, gender: "Both", active: true, entry_type: "Test" }
  ],
  MAMMOGRAPHY: [
    { name: "Mammography Bilateral", price: 1500, category: "Mammography", revenue_share: 0, gender: "Female", active: true, entry_type: "Test" }
  ]
};
