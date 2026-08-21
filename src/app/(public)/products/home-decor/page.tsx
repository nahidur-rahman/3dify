import { createCategoryMetadata, createCategoryPage } from "../categoryPage";

export const revalidate = 60;
export const generateMetadata = createCategoryMetadata("HOME_DECOR");

export default createCategoryPage("HOME_DECOR");