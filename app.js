var express = require("express");
var app = express();
var router = require("./router/index.js")
var session = require("express-session");
app.use(session({
    secret:"keyboard cat",
    resave:false,
    saveUninitialized:true,
}))
//模板引擎
app.set("view engine","ejs");

//静态页面
app.use(express.static("./public"))
app.use("/avatar",express.static("./avatar"));
//路由表
app.get("/",router.showIndex)
// 登录页
app.get("/login",router.showLogin)
app.post("/dologin",router.dologin)
//注册页
app.get("/regist",router.showRegist)
//注册接口
app.post("/doregist",router.doregist)
// 头像设置页面
app.get("/setavatar",router.showSetavatar)
//设置头像
app.post("/dosetavatar",router.doSetavatar)
// 显示剪切页面
app.get("/cut",router.showCut)
//剪切接口
app.get("/docut",router.doCut)
app.post("/doshuoshuo",router.doshuoshuo) //发表说说
app.get("/getallshuoshuo",router.getallshuoshuo) //获取说说列表
app.get("/user",router.showUser) //我的页面
app.get("/getuserinfo",router.getuserinfo)//获取用户数据
app.get("/userinfo",router.showUserinfo) //用户页面
app.get("/userlist",router.showUserlist) //显示用户列表页面
app.get("/getUserlist",router.getUserlist) //获取用户列表
app.post("/loginOut",router.loginOut) //获取用户列表
app.listen(3000)