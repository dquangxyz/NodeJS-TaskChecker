const express = require("express")
const bp = require("body-parser")
const date = require(__dirname + "/date.js") // link to date.js to get the function over there
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express()
const day = date.getDay() // export function from date.js file


app.set('view engine', 'ejs')
app.use(bp.urlencoded({extended: true}))
app.use(express.static("css"))

mongoose.connect("mongodb+srv://dquangxyz:22DQuang@cluster0.feme6.mongodb.net/todolistDB", {
  useNewUrlParser: true
})

//Set up default database
const itemSchema = {
  name: String
}
const Item = mongoose.model("Item", itemSchema)
const item1 = new Item({name: "Wake up"})
const item2 = new Item({name: "Eat breakfast"})
const item3 = new Item({name: "Drink water"})
const defaultItem = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemSchema]
}
const List = mongoose.model("List", listSchema)

// HOME PAGE
app.get("/", function(req,res){
  //Render data from database
  Item.find(function(err, data){
    if (data.length === 0) {
      Item.insertMany(defaultItem, function(err){
        if (err) {
          console.log(err)
        } else {
          console.log("Successfully added default items")
        }
      })
      res.redirect("/")
    } else {
        res.render("list", {dynamicText1: day, newListItems: data})
    }
  })
})

// Other Routes
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName)

  List.findOne({name: customListName}, function(err, listResult) {
    if (!err){
      if (!listResult){
        //Create new list
        const newList = new List({
          name: customListName,
          items: []
        })
        newList.save()
        res.redirect("/"+ customListName)
      } else {
        //Show existing list
        res.render("list", {dynamicText1: listResult.name, newListItems: listResult.items})
      }
    }
  })
})

//POST method
app.post("/", function(req, res){
  const listName = req.body.buttonAdd
  const itemName = req.body.newItem

  const item = new Item({name: itemName})

  if (listName == day) {
    //Add new item in "/" route - which is stored in db.items
    item.save()
    res.redirect("/")
  } else {
    //Add new item in other route - which is stored in db.lists
    List.findOne({name: listName}, function(err, listResult) {
      listResult.items.push(item)
      listResult.save()
      res.redirect("/" + listName)
    })
  }
})

//Delete item when checked
app.post("/delete", function(req,res) {
  const checkedItemId = req.body.checkbox
  const listName = req.body.listName
  if (listName == day){
    //Delete data in db.items - for "/" list
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully delete checked item");
      }
    })
    res.redirect("/")

  } else {
    //Delete data in db.lists - for other customized lists
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err, listResult){
        if(!err){
          res.redirect("/"+listName)
        }
      }
    )
  }
})

app.listen(3000, function(){
  console.log("Running on port 3000")
})
