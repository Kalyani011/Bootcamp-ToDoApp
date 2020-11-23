// require packages
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const currentDate = require(__dirname + "/date.js");

// create app
const app = express();

// app settings
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/todolistDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: true
// });

mongoose.connect("mongodb+srv://KalyaniKawale:test-123@cluster0.vdise.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: true
});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Go for a run"
});
const item2 = new Item({
  name: "Drink Tea"
});
const item3 = new Item({
  name: "Work on course"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);

// services
app.get("/", function(req, res) {

  Item.find(function(err, items) {
    if (err) {
      console.log(err);
    } else {
      if (items.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          err ? console.log(err) : console.log("Inserted default items successfully");
        });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Today",
          newItems: items
        });
      }
    }
  });
});

app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, results) {
    if (!err) {
      if (!results) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: results.name,
          newItems: results.items
        });
      }
    }

  })
});

app.post("/", function(req, res) {
  var itemName = req.body.nextTask;
  var listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
    });
    res.redirect("/" + listName);
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      err ? console.log(err) : res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({
        name: listName
      }, {
        $pull: {
          items: {
            _id: checkedItemId
          }
        }
      },
      function(err, foundList) {
        err ? console.log(err) : res.redirect("/" + listName);
      });
  }
});

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port === "" || port === null) {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server is running on port 3000");
});
