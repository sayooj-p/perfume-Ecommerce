const Category = require('../../models/categoryModel');

const categoryDetails = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        const limit = 3;
        const skip = (page - 1) * limit;

        const categoryData = await Category.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);
        res.render('category', {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories
        });
    } catch (error) {
        console.log("Error in showing categories:", error);
        res.redirect('/pageError');
    }
};

const loadAddCategory = (req, res) => {
    res.render('add-Category');
};

const addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ error: 'Category already exists' });
        }
        const newCategory = new Category({
            name
           
        });
        await newCategory.save();
        return res.json({ message: "Category added successfully" });
    } catch (error) {
        console.log("Error in adding category:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getListCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: false } });
        res.redirect('/admin/category');
    } catch (error) {
        res.redirect('/pageError');
    }
};
const editCategory = async (req,res)=>{
try {
    const id = req.query.id;
    // console.log(id);
    const category = await Category.findById({_id:id});
    if(!category){
        return res.status(404).send('category not found')
    }
    res.render('edit-category',{category})
} catch (error) {
    console.log('error in edit Category',error);
    res.status(500).json({error: 'error occured in edit the category'})
    
}
}
const updateCategory = async (req, res) => {
    try {
        const id = req.params.id;
        // console.log(id);
        
        const { name } = req.body;
        // console.log(req.body);

        const existingCategory = await Category.findOne({name:name})
        if(existingCategory){
            return res.status(400).json({ error: 'Category already exists' });
        }
        
        await Category.updateOne({ _id: id }, { $set: { name } });
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.log('Error updating category:', error);
        res.status(500).json({ error: 'An error occurred while updating the category' });
    }
}


const getUnListCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: true } });
        
        res.redirect('/admin/category');
    } catch (error) {
        console.log("error", error);
        res.redirect('/pageError');
    }
};

module.exports = {
    categoryDetails,
    loadAddCategory,
    addCategory,
    getListCategory,
    getUnListCategory,
    editCategory,
    updateCategory
};
