import { createCategoryMetadata, createCategoryPage } from "../categoryPage";

export const revalidate = 60;
export const generateMetadata = createCategoryMetadata("COLLECTIBLES_AND_FIGURES");

export default createCategoryPage("COLLECTIBLES_AND_FIGURES");