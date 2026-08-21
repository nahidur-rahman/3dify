import { createCategoryMetadata, createCategoryPage } from "../categoryPage";

export const revalidate = 60;
export const generateMetadata = createCategoryMetadata("DESK_ACCESSORIES");

export default createCategoryPage("DESK_ACCESSORIES");