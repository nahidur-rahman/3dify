import { createCategoryMetadata, createCategoryPage } from "../categoryPage";

export const revalidate = 60;
export const generateMetadata = createCategoryMetadata("KEYCHAINS");

export default createCategoryPage("KEYCHAINS");
