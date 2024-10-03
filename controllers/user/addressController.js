const mongoose = require("mongoose");
const User = require("../../models/userModel");
const Address = require("../../models/addressModel");
const { session } = require("passport");
const { log } = require("debug/src/node");

// Address Controller

// 1. Get and Render Manage Address Page
const getManageAddress = async (req, res) => {
  try {
    const userId = req.session.user._id; // Assuming `userId` is stored in session

    // Fetch addresses only for the logged-in user
    const userAddresses = await Address.findOne({ userId }).populate("userId");

    if (!userAddresses) {
      return res.render("manageAddress", { addresses: [] });
    }

    let addresses = userAddresses.address;

    // Find the primary address
    const primaryAddressIndex = addresses.findIndex(
      (address) => address.isActive
    );
    const primaryAddress =
      primaryAddressIndex !== -1
        ? addresses.splice(primaryAddressIndex, 1)[0]
        : null;

    // Assume the last address in the list is the newly added one
    const newlyAddedAddress =
      addresses.length > 0
        ? addresses.splice(addresses.length - 1, 1)[0]
        : null;

    // Construct the final sorted array
    const sortedAddresses = [];
    if (primaryAddress) sortedAddresses.push(primaryAddress);
    if (newlyAddedAddress) sortedAddresses.push(newlyAddedAddress);
    sortedAddresses.push(...addresses); // Append the remaining addresses

    res.render("manageAddress", { addresses: sortedAddresses });
    // console.log("Addresses fetched:", sortedAddresses);
  } catch (error) {
    console.log("Error loading the manage address page", error);
    res.redirect("/pageNotFound");
  }
};

// 2. Load Add Address Page
const loadAddAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Fetch the user data based on the userId
    const userData = await User.findById({ _id: userId });

    if (!userData) {
      return res.status(404).send("User not found");
    }

    res.render("addAddress", { userData });
    // console.log("User data loaded:", userData);
  } catch (error) {
    console.log("Error loading the add address page", error);
    res.status(500).send("Internal Server Error");
  }
};

// 3. Add New Address
const addAddress = async (req, res) => {
  try {
    const userId = req.session.user._id; // Extract the userId from session
    const {
      name,
      phone,
      pincode,
      locality,
      city,
      state,
      addressType,
      alternative,
      landmark,
      isActive,
    } = req.body;

    if (
      !name ||
      !phone ||
      !pincode ||
      !locality ||
      !city ||
      !state ||
      !addressType
    ) {
      return res.status(400).send("All fields are required");
    }

    // Find the user's address document by userId
    const userAddressDocument = await Address.findOne({ userId });

    if (userAddressDocument) {
      // If isActive is true, set all existing addresses to inactive
      if (isActive) {
        userAddressDocument.address.forEach((address) => {
          address.isActive = false;
        });
        await userAddressDocument.save();
      }

      // Push new address to the existing document
      userAddressDocument.address.push({
        name,
        phone,
        locality,
        landmark,
        pincode,
        city,
        state,
        addressType,
        altPhone: alternative,
        isActive: isActive || false,
      });
      await userAddressDocument.save();

      // Ensure only one address is active
      if (isActive) {
        const activeAddress = userAddressDocument.address.find(
          (address) => address.isActive
        );

        if (!activeAddress && userAddressDocument.address.length > 0) {
          const lastAddedAddress =
            userAddressDocument.address[userAddressDocument.address.length - 1];

          await Address.updateOne(
            { userId, "address._id": lastAddedAddress._id },
            { $set: { "address.$.isActive": true } }
          );
        }
      }

      // console.log("Address added to existing document:", userAddressDocument);
    } else {
      // Create a new address document for the user
      const newAddressDocument = new Address({
        userId: userId, // Correct reference to userId
        address: [
          {
            name,
            phone,
            locality,
            landmark,
            pincode,
            addressType,
            city,
            state,
            altPhone: alternative,
            isActive: isActive || true, // Set to true if no other addresses exist
          },
        ],
      });

      await newAddressDocument.save();
      // console.log("New address document created:", newAddressDocument);
    }

    res.redirect("/manageAddress");
    console.log("Address added successfully");
  } catch (error) {
    console.error("Error adding the address:", error);
    res.status(500).send("Internal Server Error");
  }
};


const editAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressId } = req.params; // Get the addressId from the URL

    // Find the address by its `_id` in the user's address array
    const userAddress = await Address.findOne(
      { userId, "address._id": addressId },
      { "address.$": 1 } // Project only the matching address
    );

    if (
      !userAddress ||
      !userAddress.address ||
      userAddress.address.length === 0
    ) {
      console.log("Address not found");
      return res.status(404).send("Address not found");
    }

    // Render the edit address page with the found address details
    res.render("editAddress", { address: userAddress.address[0] });
  } catch (error) {
    console.log("Error loading edit address page", error);
    res.status(400).send("Error loading the edit profile page");
  }
};

const updateAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const addressId = req.params.addressId;
    // console.log(userId);

    const {
      name,
      phone,
      pincode,
      locality,
      city,
      state,
      addressType,
      alternative,
      landmark,
      isActive,
    } = req.body;

    if (
      !name ||
      !phone ||
      !pincode ||
      !locality ||
      !city ||
      !state ||
      !addressType
    ) {
      return res.status(400).send("All fields are required");
    }

    // Update the specific address in the address array
    const updatedAddress = await Address.updateOne(
      { userId, "address._id": addressId },
      {
        $set: {
          "address.$.name": name,
          "address.$.phone": phone,
          "address.$.pincode": pincode,
          "address.$.locality": locality,
          "address.$.city": city,
          "address.$.state": state,
          "address.$.addressType": addressType,
          "address.$.altPhone": alternative,
          "address.$.landmark": landmark,
          "address.$.isActive": isActive || false,
        },
      }
    );

    if (isActive) {
      // Retrieve the user's document
      const addressDoc = await Address.findOne({ userId });

      if (addressDoc) {
        // Modify the `isActive` field for all other addresses
        addressDoc.address.forEach((address) => {
          if (address._id.toString() !== addressId) {
            address.isActive = false;
          }
        });

        // Save the updated document
        await addressDoc.save();
      }
    } else {
      const addressDoc = await Address.findOne({ userId });
      if (addressDoc) {
        const activeAddress = addressDoc.address.find(
          (address) => address.isActive
        );

        if (!activeAddress && addressDoc.address.length > 0) {
          const lastAddedAddress =
            addressDoc.address[addressDoc.address.length - 1];

          await Address.updateOne(
            { userId, "address._id": lastAddedAddress._id },
            { $set: { "address.$.isActive": true } }
          );
        }

        // Save the updated document
      }
    }

    if (updatedAddress.nModified === 0) {
      console.log("Address update failed");
      return res.status(400).send("Address update failed");
    }

    res.redirect("/manageAddress");
    console.log("Address updated successfully");
  } catch (error) {
    console.error("Error updating the address:", error);
    res.status(500).send("Internal Server Error");
  }
};
const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.addressId; // Ensure this matches your route parameter

    // Find the user's addresses
    const userAddresses = await Address.findOne({ userId });
    const addressToDelete = userAddresses.address.find(
      (address) => address._id.toString() === addressId
    );

    if (!addressToDelete) {
      console.log("Address not found");
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const isActiveAddress = addressToDelete.isActive;

    // Remove the address from the user's address array
    const updatedUserAddress = await Address.updateOne(
      { userId },
      { $pull: { address: { _id: addressId } } }
    );

    if (updatedUserAddress.modifiedCount === 0) {  // Use `modifiedCount` instead of `nModified`
      console.log("Address deletion failed");
      return res.status(400).json({ success: false, message: "Address deletion failed" });
    }
    

    // If the deleted address was active and there are remaining addresses
    if (isActiveAddress) {
      const updatedUserAddresses = await Address.findOne({ userId });

      if (updatedUserAddresses.address.length > 0) {
        // Get the first address in the array
        const firstAddress = updatedUserAddresses.address[0];

        // Set it as the new active address
        await Address.updateOne(
          { userId, "address._id": firstAddress._id },
          { $set: { "address.$.isActive": true } }
        );
      }
    }

    // Check if there are no addresses left
    const finalUserAddresses = await Address.findOne({ userId });
    if (finalUserAddresses.address.length === 0) {
      // No addresses remaining
      res.status(200).json({ success: true, message: "Address deleted successfully. No addresses remaining." });
    } else {
      console.log("Address deleted successfully");
      res.status(200).json({ success: true, message: "Address deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting the address:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



module.exports = {
  getManageAddress,
  addAddress,
  loadAddAddress,
  editAddress,
  updateAddress,
  deleteAddress,
};
