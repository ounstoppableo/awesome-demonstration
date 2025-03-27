### 介绍🎉

这是一个关于**内容展示**应用的源码，可以把它称作『**Awesome Demonstration**』，它支持：

- [x] 组件上传
- [x] 组件在线编辑
- [x] Vue/React/HTML语言支持
- [x] 其他一些趣味小功能
- [x] 响应式布局

### 启动方法

#### mysql数据库字段

- componentInfo表

  | 列                 | 数据类型      | 键   | 默认              |
  | ------------------ | ------------- | ---- | ----------------- |
  | id                 | varchar(100)  | PRI  |                   |
  | name               | varchar(100)  |      |                   |
  | framework          | varchar(100)  |      | '[]'              |
  | vueEntryFileName   | varchar(100)  |      |                   |
  | vueRelevantFiles   | varchar(1000) |      |                   |
  | vueExternalFiles   | varchar(1000) |      |                   |
  | htmlEntryFileName  | varchar(100)  |      |                   |
  | htmlRelevantFiles  | varchar(1000) |      |                   |
  | htmlExternalFiles  | varchar(1000) |      |                   |
  | reactEntryFileName | varchar(100)  |      |                   |
  | reactRelevantFiles | varchar(1000) |      |                   |
  | reactExternalFiles | varchar(1000) |      |                   |
  | createTime         | timestamp     |      | CURRENT_TIMESTAMP |
  | index              | int(11)       |      |                   |

  触发器：

  ~~~sql
  CREATE DEFINER=`root`@`%` TRIGGER before_insert_componentInfo
  BEFORE INSERT ON componentInfo
  FOR EACH ROW
  BEGIN
      DECLARE new_index INT;
      SELECT COALESCE(MAX(`index`), 0) + 1 INTO new_index FROM componentInfo;
      SET NEW.`index` = new_index;
  END
  ~~~

- fileMap表

  | 列          | 数据类型     | 键   | 默认 |
  | ----------- | ------------ | ---- | ---- |
  | id          | varchar(100) | PRI  |      |
  | fileName    | varchar(100) | PRI  |      |
  | fileContent | text         |      |      |

#### redis

启动一个redis服务，应用默认会连接3号数据库，如果有需要可以到/awesome-demonstration/src/app/lib/redis.ts中修改。

#### 环境配置

在根目录添加.env.local文件：

~~~
DB_HOST=mysql服务域名
DB_USER=username
DB_PASSWORD=password
DB_NAME=awesome_demonstration

AUTH_ADDR=token认证地址，这个需要自己实现（用于文件上传、组件添加等接口）

SERVER_PORT=应用启动端口

REDIS_HOST=redis服务域名
REDIS_PORT=redis服务端口
~~~

#### 启动命令

~~~sh
pnpm i
pnpm run dev
~~~

