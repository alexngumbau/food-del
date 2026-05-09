import userModel from "../models/userModel.js";

// add items to user cart
const addToCart = async (req, res) => {
  try {
    await userModel.findByIdAndUpdate(
      req.userId,
      {
        $inc: {
          [`cartData.${req.body.itemId}`]: 1,
        }
      }
    );
    res.json({ success: true, message: "Added To Cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Internal server error" });
  }
};

// remove items from user cart
const removeFromCart = async (req, res) => {
  try {
    await userModel.findByIdAndUpdate(
      req.userId,
      {
        $inc: {
          [`cartData.${req.body.itemId}`]: -1,
        }
      }
    );
    res.json({ success: true, message: "Removed From Cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Internal server error" });
  }
};

// fetch user cart data
const getCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.userId);
    let cartData = userData.cartData;
    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Internal server error" });
  }
};

export { addToCart, removeFromCart, getCart };
