const express= require("express");
const app= express();
const bodyParser= require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

mongoose.connect("mongodb+srv://admin-shagun:test123@cluster0.q1dk9.mongodb.net/todolistDB",{
    useUnifiedTopology: true,
    useNewUrlParser: true
});


const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist! ",
});

const item2 = new Item({
    name: "Hit the ➕ button to add a new item",
});

const item3 = new Item({
    name: "<<--- Hit this to delete an item",
});

const defaultItems = [item1,item2,item3];

const listSchema= new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List",listSchema);

app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

let item="";
let day="";

app.get("/",function(req,res){

// Getting todays date and day
const event = new Date(Date.UTC(2012, 11, 20, 3, 0, 0));
const options = { weekday: 'long', month: 'long', day: 'numeric' };
day = event.toLocaleDateString('en-US', options);

Item.find({},function(err,foundItems){
    
    if(foundItems.length===0){
        Item.insertMany(defaultItems,function(err){
            if(err){
                    console.log(err);
            }
            else{
                   console.log("Successfully inserted default items in the db");
            }
        });   
        res.redirect("/");
    }
    else{
        res.render('list', {TodaysDate: day,listItemsArr:foundItems});
    }
});

});

app.get("/:customListName",function(req,res){
    console.log(req.params.customListName);
    const customListName= _.capitalize(req.params.customListName);
    List.findOne({name: customListName},function(err,foundList){
        if(!err){
            if(!foundList){
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }
            else{
                res.render("list",{TodaysDate: foundList.name,listItemsArr:foundList.items})
            }
        }
    })
    
});


app.post("/",function(req,res){
    item=req.body.item;
    const listName = req.body.list;
    const newTask = new Item({
        name: item
    });

    if(listName === day){
        newTask.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: listName},function(err,foundList){
            foundList.items.push(newTask);
            foundList.save();
            res.redirect("/"+listName);
        });
    }

});

app.post("/delete",function(req,res){
    console.log();
    const checkedItemId= req.body.checkbox;
    const listName = req.body.listName;

    if(listName===day){
        Item.findByIdAndDelete(checkedItemId,function(err){
            if(!err){
                console.log("Successfully deleted");
            res.redirect("/");
            }
        });
    }
    else{
        List.findOneAndUpdate({name: listName},{ $pull: {items:{_id: checkedItemId}} },function(err,result){
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }
    
});

let port = process.env.PORT;
if(port== null || port ==""){
    port= 3000;
}

app.listen(port,function(){
    console.log("Server is running");
});

