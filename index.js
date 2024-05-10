// telnet localhost 8000
// docker run -it --rm redis redis-cli -h host.docker.internal -p 8000

const net = require("net");
const Parser = require("redis-parser");

const store = {};

console.log("Tcp is connected");
const server = net.createServer((connection) => {
  console.log("client connected");

  connection.on("data", (data) => {
    const parser = new Parser({
      returnReply: (reply) => {
        console.log("=>", reply);
        let command = reply[0];

        switch (command) {
            //get and set command for redis

          case "set":
            {
              const key = reply[1];
              const value = reply[2];
              console.log("In set");

              // Checking if : include in key
              if (key.includes(":")) {
                let keys = key.split(":");
                let first = keys[0];
                let second = keys[1];
                console.log({
                  first: first,
                  second: second,
                });
                if (store[first]) {
                  let arr = store[first];
                  let obj = {};
                  obj[second] = value;
                  arr.push(obj);
                  store[first] = arr;
                } else {
                  let obj = {};
                  obj[second] = value;
                  store[first] = [obj];
                }
              } else {
                if(store[key]){
                    connection.write(`-Error value can not be empty\r\n`)
                    return ;
                }
                store[key] = value;
              }
              console.log("Store :- ", store);
              connection.write("+OK\r\n");
            }
            break;

          case "get":
            const key = reply[1];

            if (key.includes(":")) {
              let keys = key.split(":");
              let first = keys[0];
              let second = keys[1];
              console.log({
                s:store[first],
                second: second,

              });
              if(store[first]===undefined){
                connection.write("$-1\r\n");
                return;
              }
                let fil = store[first].filter((obj)=>Object.keys(obj)[0]===second);
                console.log({fil})
                if(!fil.length){
                    connection.write("$-1\r\n");
                    return;
                }
                const storedValue = fil[0];
                console.log({storedValue})
                connection.write(
                    `$${storedValue[second].length}\r\n${storedValue[second]}\r\n`
                  );

            } else {
              const storedValue = store[key];
              console.log("In get", { key: key, storedValue: storedValue });
              console.log(storedValue);
              if (!storedValue) {
                console.log("if");
                connection.write("$-1\r\n");
              } else {
                console.log("else");
                if(typeof storedValue === Array){
                    connection.write("$-1\r\n");
                    return;
                }

                connection.write(
                  `$${storedValue.length}\r\n${storedValue}\r\n`
                );
              }
            }

            break;

          case "COMMAND":
            connection.write("+OK\r\n");
        }
      },
      returnError: (err) => {
        console.log(err);
      },
    });
    parser.execute(data);
  });
});

server.listen(8000, () => console.log("Server is running on port 8000"));
