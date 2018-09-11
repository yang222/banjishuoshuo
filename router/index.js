
var formidable = require("formidable");
var db = require("../models/db.js");
var md5 = require("../models/md5.js");
var session = require("express-session");
var path = require("path");
var fs = require("fs");
var gm = require("gm");
// 首页
exports.showIndex = function(req,res,next){
    if(req.session.login == "1"){
        var username = req.session.username;
    }else{
        var username = '';
    }
    db.find("sql","users",{"username":username},function(err,result){
        if(result.data.length == 0){
            var avatar = "moren.jpg"
        }else{
            var avatar = result.data[0].avatar || "moren.jpg";
        }
        res.render("index",{
            "login":req.session.login == "1" ? true : false,
            "username":req.session.login == "1" ? req.session.username : "",
            "active":"首页",
            "avatar":avatar,
        });
    })
    
}
// 登录页面
exports.showLogin = function(req,res,next){
    res.render("login",{
        "login":req.session.login == "1" ? true : false,
        "username":req.session.login == "1" ? req.session.username : "",
        "active":"登录",
    });
}
// 登录接口
exports.dologin = function(req,res,next){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var username = fields.username;
        var password = fields.password;
        password = md5(md5(password).substr(4,7) + md5(password));
        db.find("sql","users",{"username":username},function(err,result){
            if(err){
                res.json({code:1003,"desc":"服务器内部错误"});
                return
            }
            if(result.data.length >0){
                if(password == result.data[0].password){
                    console.log(result)
                    req.session.login = 1;
                    req.session.username = username;
                    req.session.avatar = result.data[0].avatar || "moren.jpg";
                    res.json({code:1000,"desc":"登录成功"});
                }else{
                    res.json({code:1002,"desc":"密码错误"});
                }
            }else{
                res.json({code:1001,"desc":"用户名不存在"});
            }
           
        })
    });
}
// 注册页面
exports.showRegist = function(req,res,next){
    res.render("regist",{
        "login":req.session.login == "1" ? true : false,
        "username":req.session.login == "1" ? req.session.username : "",
        "active":"注册",
    });
}
// 注册接口
exports.doregist = function(req,res,next){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var username = fields.username;
        var password = fields.password;
        password = md5(md5(password).substr(4,7) + md5(password));
        db.find("sql","users",{"username":username},function(err,result){
            if(result.data.length >0){
                res.json({code:1001,"desc":"存在该用户名"});
                return
            }
            db.insertOne("sql","users",{"username":username,"password":password,"avatar":"moren.jpg"},function(err,result){
                if(err){
                    res.json({"code":1002,"desc":"注册失败"});
                    return
                }
                req.session.login = 1;
                req.session.username = username;
                req.session.avatar = "moren.jpg";
                res.json({"code":1000,"desc":"注册成功"}); 
            })
        })
    });
}
exports.showSetavatar = function(req,res,next){
        if(req.session.login != 1){
            res.redirect("/login")
            return
        }
        res.render("setavatar",{
            "login":req.session.login == "1" ? true : false,
            "username":req.session.login == "1" ? req.session.username : "",
            "active":"修改头像",
            "avatar":req.session.avatar,
        });
    // }
    
}
exports.doSetavatar = function(req,res,next){
    var form = new formidable.IncomingForm();
    form.uploadDir =path.normalize(__dirname +"/../avatar");
    form.parse(req, function(err, fields, files) {
        var oldpath =files.touxiang.path;
        var newpath = path.normalize(__dirname +"/../avatar") + "/"+req.session.username+".jpg";
        fs.rename(oldpath,newpath,function(err){
            if(err){
                res.json({
                    code:1001,
                    desc:"上传失败"
                })
                return
            }
            req.session.avatar = req.session.username+".jpg";
            res.redirect("/cut")
    
        })
    })
}
// 显示切图
exports.showCut  = function(req,res,next){
    if(req.session.login != 1){
        res.redirect("/login")
        return
    }
    res.render("cut",{
        avatar:req.session.avatar,
    })
}
exports.doCut = function(req,res,next){
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;
    gm("./avatar/"+filename)
        .crop(w,h,x,y)
        .resize(100,100,"!")
        .write("./avatar/"+filename,function(err){
            if(err){
                res.json({
                    code:1001,
                    desc:"剪切失败",
                })
                return
            }
            //更改数据库当前用户的avatar值
            db.updateMany("sql","users",{"username":req.session.username},{"avatar":req.session.avatar},function(err,result){
                if(err){
                    res.json({
                        code:1002,
                        desc:"服务器内部错误",
                    })
                    return
                }
                res.json({
                    code:1000,
                    desc:"剪切成功",
                })
            })
            
        })
}
// 发表说说
exports.doshuoshuo = function(req,res,next){
    if(req.session.login != 1){
        res.redirect("/login")
        return
    }
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var content = fields.content;
        db.insertOne("sql","content",{
            "username":req.session.username,
            "datatime":new Date(),
            "content":content,
            "avatar":req.session.avatar,
        },function(err,result){
            if(err){
                res.json({"code":1001,"desc":"发表说说失败"});
                return
            }
            res.json({"code":1000,"desc":"发表说说成功！"}); 
        })
     
    });
}
// 获取所有说说
exports.getallshuoshuo = function(req,res,next){
    if(req.session.login != 1){
        res.redirect("/login")
        return
    }
    var page = req.query.page;
    var pageSize = req.query.pageSize;
    db.find("sql","content",{},{"page":page,"pageSize":pageSize,sort:{"datatime":-1}},function(err,result){
        if(err){
            res.json({"code":1001,"desc":"获取列表失败"});
            return
        }
        result.code = 1000,
        result.desc = "成功"
        res.json(result); 
    })
}
// 显示我的说说页面
exports.showUser = function(req,res,next){
    if(req.session.login != 1){
        res.redirect("/login")
        return
    }
    var user = req.query.username
    res.render("user",{
        "login":req.session.login == "1" ? true : false,
        "username":req.session.login == "1" ? req.session.username : "",
        "user":user,
        "active":"我的说说",
        "avatar":req.session.avatar,
        "userinfo":true,
    })
}
// 获取用户数据
exports.getuserinfo = function(req,res,next){
    if(req.session.login != 1){
        res.redirect("/login")
        return
    }
    var user = req.query.username
    db.find("sql","content",{"username":user},function(err,result){
        if(err){
            res.json({
                code:1001,
                desc:"服务器内部错误"
            })
            return 
        }
        result.code = 1000
        result.desc = "成功"
        res.json(result)
    })
}
// 显示用户页面
exports.showUserinfo = function(req,res,next){
    if(req.session.login != 1){
        res.redirect("/login")
        return
    }
    var user = req.query.username
    res.render("user",{
        "login":req.session.login == "1" ? true : false,
        "username":req.session.login == "1" ? req.session.username : "",
        "user":user,
        "active":"个人主页",
        "avatar":req.session.avatar,
        "userinfo":false,
    })
}
// 显示用户列表页面
exports.showUserlist = function(req,res,next){
    if(req.session.login != 1){
        res.redirect("/login")
        return
    }
    var user = req.query.username
    res.render("userlist",{
        "login":req.session.login == "1" ? true : false,
        "username":req.session.login == "1" ? req.session.username : "",
        "active":"所有成员",
        "avatar":req.session.avatar,
    })
}
// 获取用户列表
exports.getUserlist = function(req,res,next){
    if(req.session.login != 1){
        res.redirect("/login")
        return
    }
    db.find("sql","users",{},function(err,result){
        if(err){
            res.json({
                code:1001,
                desc:"服务器内部错误"
            })
            return 
        }
        result.code = 1000
        result.desc = "成功"
        res.json(result)
    })
}

exports.loginOut = function(req,res){
    req.session.login = "";
    req.session.username = "";
    res.json({code:1000,desc:"成功"})
}