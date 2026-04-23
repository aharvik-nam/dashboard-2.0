import dotenv from "dotenv";
dotenv.config();

export const PIPELINE_ID = "702523";
export const FORDELING_STAGE_ID = "702528";
export const STAGE_ID = "702529";
export const ARCHIVE_STAGE_ID = "702536";

export const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
export const NM_API_KEY = process.env.NM_API_KEY;
export const DIMU_API_KEY = process.env.DIMU_API_KEY;

export const MOCK_JOBS = [
  {
    id: "mock-1",
    title: "Foto av maleri: Brudeferden i Hardanger",
    due_date: "2024-05-15",
    deadline: "2024-05-20",
    type: "Maleri",
    nmids: ["NG.M.00467"],
    folder_link: "https://nasjonalmuseet.sharepoint.com/folder1",
    pipeline: PIPELINE_ID,
    status: STAGE_ID,
    description: "Høyoppløselig foto av maleriet for ny katalog.",
    owner_names: ["Andreas Harvik"]
  }
];
