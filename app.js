
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var _ = require("lodash");
require("dotenv").config();


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-kunal:Test123@cluster0.wlztokb.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model("Item", itemsSchema);

const item1 = Item({
  name: "Welcome to Todolist."
});

const item2 = Item({
  name: "Hit the + button to add a new item."
});

const item3 = Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// Item.insertMany(defaultItems);

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  async function readData(){
    try {
      const list = await Item.find({});
      
      if (list.length === 0){
        Item.insertMany(defaultItems);

        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: list});
      }

    } catch (error) {
      console.error("Error occurred:", error);
    }
  }

  readData();

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  
  async function findListName() {
    try {
      const clist = await List.findOne({name: customListName});
      if(!clist){

        const list = List({
          name: customListName,
          items: defaultItems
        });
        
        list.save();

        res.redirect("/" + customListName);

      } else {
        res.render("list", { listTitle: clist.name, newListItems: clist.items });
      }
      
    } catch (error) {
      console.error("Error occurred:", error);
    }
  }
  
  findListName();
  
  
});

app.post("/", function(req, res){
  
  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new Item({
    name: itemName
  });
  
  if (listName === 'Today'){
    item.save();
    res.redirect("/");
  } else {
    async function findList(){
      try {
        const foundlist = await List.findOne({name: listName});
        foundlist.items.push(item);
        foundlist.save();
        res.redirect("/" + listName);
      } catch (error) {
        console.error("Error occurred:", error); 
      }
    }

    findList();

  } 
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  
  if (listName === 'Today'){
    async function deleteDocumentById(id){
      try {
        const deletedItem = await Item.findByIdAndRemove(id).exec();
        res.redirect("/");
      } catch (error) {
        console.error("Error occurred:", error);
      }
    }
  
    deleteDocumentById(checkedItemId);
  
  } else {

    async function deleteListItem(){
      try {
        const deletedListItem = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
        res.redirect("/" + listName);
      } catch (error) {
        console.error("Error Occurred:", error);
      }
    }

    deleteListItem();

  }


  // Item.findByIdAndRemove(checkedItemId);

});




app.get("/about", function(req, res){
  res.render("about");
});

const PORT = process.env.PORT;

app.listen(PORT, function() {
  console.log("Server started on port " + PORT);
});
