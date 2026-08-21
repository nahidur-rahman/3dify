import { createCategoryMetadata, createCategoryPage } from "../categoryPage";

export const revalidate = 60;
export const generateMetadata = createCategoryMetadata("GAMING_AND_POP_CULTURE");

export default createCategoryPage("GAMING_AND_POP_CULTURE");