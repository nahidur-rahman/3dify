import { createCategoryMetadata, createCategoryPage } from "../categoryPage";

export const revalidate = 60;
export const generateMetadata = createCategoryMetadata("CUSTOM_AND_PERSONALIZED");

export default createCategoryPage("CUSTOM_AND_PERSONALIZED");