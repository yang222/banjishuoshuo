
//这个模块里封装了所有对数据库的常用操作

//不管数据库的什么操作都要先连接数据库，所以我们可以把连接数据库封装成函数

var MongoClient = require("mongodb").MongoClient;
var setting = require("./setting")
//连接数据库
function _connectDB(callback){
    var url = setting.dbUrl;
    //连接数据库
    MongoClient.connect(url,function(err,db){
        console.log("连接成功！");
        callback(err,db)
    })
}

//插入数据
exports.insertOne =function(sql,collectionName,json,callback){
    _connectDB(function(err,db){
        if(err){
            callback(err,null)
            db.close();
            return
        }
        var dbo = db.db(sql);
        dbo.collection(collectionName).insertOne(json,function(err,result){
            callback(err,result);
            db.close();//关闭数据库
        })
    })
};

//查找数据,找到所有数据
exports.find = function(sql,collectionName,json,args,callback){
    var result = []; //返回的数组
    if(arguments.length == 4){
        var callback = args;
        var args = {"page":0,"pageSize":0};
    }else if(arguments.length == 5){
        var args = args;
        var callback = callback;
    }else{
        callback("find的参数少于4个",null)
        return
    }
    //连接数据库，连接成功之后查找所有
    _connectDB(function(err,db){
        if(err){
            callback(err,null)
            db.close();
            return
        }
        var dbo = db.db(sql);
        var skipNum = args.pageSize*(args.page-1) || 0;
        var limitNum = parseInt(args.pageSize)|| 0;
        var sort = args.sort||{};
        dbo.collection(collectionName).find(json).limit(limitNum).skip(skipNum).sort(sort).toArray(function(err,result){
            if(err){
                callback(err,null)
                db.close();
                return 
            }
            //查找总条数
            dbo.collection(collectionName).count({}).then(function(count){
                callback(null,{
                    'data':result,
                    'totNum':count,
                    'page':args.page,
                });
                db.close();
            })
            
        });
    })
}

//删除
exports.deleteMany = function(sql,collectionName,json,callback){
    _connectDB(function(err,db){
        if(err){
            callback(err,null)
            db.close();
            return
        }
        var dbo = db.db(sql);
        // 删除
        dbo.collection(collectionName).deleteMany(json,function(err,result){
            callback(err,result)
            db.close();
        })
    })
}

//修改
exports.updateMany = function(sql,collectionName,json1,json2,callback){
    _connectDB(function(err,db){
        if(err){
            callback(err,null)
            db.close();
            return
        }
        var dbo = db.db(sql);
        dbo.collection(collectionName).updateMany(json1,{$set:json2},function(err,result){
            callback(err,result)
            db.close();
        })
    })
}

//获取总条数
exports.getAllCount = function(sql,collectionName,callback){
    _connectDB(function(err,db){
        if(err){
            callback(err,null)
            db.close();
            return
        }
        var dbo = db.db(sql);
        dbo.collection(collectionName).count({}).then(function(count){
            callback(count)
        });
    })
}