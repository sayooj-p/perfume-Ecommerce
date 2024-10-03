const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel');

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
    res.render('addCategory');
};

const addCategory = async (req, res) => {
    try {
      const { name } = req.body;
  
      // Use case-insensitive search for category name
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') }  
      });
  
      if (existingCategory) {
        return res.status(400).json({ error: 'Category already exists' });
      }
  
      // Save the new category with plain string `name`
      const newCategory = new Category({
        name: name 
      });
  
      await newCategory.save();
      return res.json({ message: "Category added successfully" });
  
    } catch (error) {
      console.error("Error in adding category:", error);
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
    res.render('editCategory',{category})
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

const addCategoryOffer =  async (req,res)=>{
    try {
        const percentage = parseInt(req.body.percentage);
        const categoryId = req.body.categoryId;
        const findCategory = await Category.findById(categoryId);
        // if(!findCategory) {
        //     return res.status(404).json({status:false, message:"Category not found"});
        // }
        const products = await Product.find({category:findCategory._id});
        const hasProductOffer = products.some((product)=>product.productOffer>=percentage);
        if(hasProductOffer) {
            return res.json({status:false, message:'products within this category have product  Offers'});
        }
        await Category.updateOne({_id:categoryId},{$set:{categoryOffer:percentage}});

        for(const product of products) {
            product.productOffer  = 0;
            product.price = product.regularPrice;
            await product.save();
        }
        res.json({status:true});
        
    } catch (error) {
        console.log('error showing to add offers',error);
        res.redirect('/pageNotFound');
        
        
    }
}

const removeCategoryOffer = async(req,res)=>{
    try {
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);
        if(!category){
            return res.status(404).json({status:false, message:'Category not found'});
        }
        const percentage = category.categoryOffer;
        const products = await Product.find({category:category._id});

        if(products.length > 0){
                for(const product of products){
                    product.price += Math.floor(product.regularPrice * (percentage/100));
                    product.productOffer = 0;
                    await product.save();
                }
        }
        category.categoryOffer = 0;
        await category.save();
        res.json({status:true})
        
    } catch (error) {
        console.log('error to remove offer ',error);
        res.redirect('/pageNotFound');
        
        
    }
}

module.exports = {
    categoryDetails,
    loadAddCategory,
    addCategory,
    getListCategory,
    getUnListCategory,
    editCategory,
    updateCategory,
    addCategoryOffer,
    removeCategoryOffer
};
