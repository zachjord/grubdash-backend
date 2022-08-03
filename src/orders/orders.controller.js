const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// Start Middleware //
function bodyHas(propName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propName]) return next();
    next({
      status: 400,
      message: `A '${propName}' property is required.`,
    });
  };
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const findId = orders.find((order) => order.id === orderId);
  if (findId) {
    res.locals.order = findId;
    return next();
  }
  next({
    status: 404,
    message: `Order ${req.params.orderId} not found.`,
  });
}

function bodyHasStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status) {
    res.locals.status = status;
    return next();
  } else {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
}

function statusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (
    status.includes("pending") ||
    status.includes("preparing") ||
    status.includes("out-for-delivery") ||
    status.includes("delivered")
  ) {
    res.locals.status = status;
    return next();
  }
  next({
    status: 400,
    message: `status property must be valid string: 'pending', 'preparing', 'out-for-delivery', or 'delivered'`,
  });
}

function statusIsNotPending(req, res, next) {
  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }
  next();
}

function dishesArrayIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
  next();
}

function dishesArrayLengthIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish) => {
    const quantity = dish.quantity;
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      return next({
        status: 400,
        message: `Dish ${dish.id} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function dataIdMatchCheck(req, res, next) {
  const { data: { id } = {} } = req.body;
  if (!id || id === req.params.orderId) return next();
  else {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${req.params.orderId}`,
    });
  }
}
// End Middleware //

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  const orderId = req.params.orderId;
  const findOrder = orders.find((order) => order.id === orderId);
  res.json({ data: findOrder });
}

function update(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const { quantity } = dishes;
  const findOrder = res.locals.order;
  findOrder.deliverTo = deliverTo;
  findOrder.mobileNumber = mobileNumber;
  findOrder.status = status;
  findOrder.dishes = dishes;
  findOrder.dishes.quantity = quantity;
  res.json({ data: findOrder });
}

function destroy(req, res) {
  const orderId = res.locals.order;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

function list(req, res) {
  res.json({ data: orders });
}

module.exports = {
  create: [
    bodyHas("deliverTo"),
    bodyHas("mobileNumber"),
    bodyHas("dishes"),
    dishesArrayIsValid,
    dishesArrayLengthIsValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyHas("deliverTo"),
    bodyHas("mobileNumber"),
    bodyHas("dishes"),
    bodyHasStatus,
    statusIsValid,
    dataIdMatchCheck,
    dishesArrayIsValid,
    dishesArrayLengthIsValid,
    update,
  ],
  delete: [orderExists, statusIsNotPending, destroy],
  list,
};
