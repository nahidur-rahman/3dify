import { createCategoryMetadata, createCategoryPage } from "../categoryPage";

export const revalidate = 60;
export const generateMetadata = createCategoryMetadata("PET_ACCESSORIES");

export default createCategoryPage("PET_ACCESSORIES");