let clientes = [];

exports.addCliente = (res)=>{
  clientes.push(res);
};

exports.removeCliente = (res)=>{
  clientes = clientes.filter(c => c !== res);
};

exports.enviar = (data)=>{
  clientes.forEach(c=>{
    c.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};