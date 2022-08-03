const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
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

function priceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `'price' must be a number greater than 0.`,
    });
  }
  next();
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const findDish = dishes.find((dish) => dish.id === dishId);
  if (findDish) {
    res.locals.dish = findDish;
    return next();
  } else {
    next({
      status: 404,
      message: `No dish with ID ${dishId}.`,
    });
  }
}

function dataIdMatchCheck(req, res, next) {
  if (!req.body.data.id) return next();
  if (req.body.data.id === req.params.dishId) {
    next();
  } else {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${req.params.dishId}`,
    });
  }
}
// End Middleware //

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const findDish = res.locals.dish;
  findDish.name = name;
  findDish.description = description;
  findDish.price = price;
  findDish.image_url = image_url;
  res.json({ data: findDish });
}

function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  create: [
    bodyHas("name"),
    bodyHas("description"),
    bodyHas("price"),
    bodyHas("image_url"),
    priceIsValid,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyHas("name"),
    bodyHas("description"),
    bodyHas("price"),
    bodyHas("image_url"),
    priceIsValid,
    dataIdMatchCheck,
    update,
  ],
  list,
};
