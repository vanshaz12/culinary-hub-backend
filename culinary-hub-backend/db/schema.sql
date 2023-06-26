CREATE DATABASE culinary_hub;

-- Create the "users" table to store user information
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Create the "lists" table to store user-created lists
CREATE TABLE lists (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create the "recipes" table to store recipe information
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  spoonacular_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  ingredients JSONB,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the "list_recipes" junction table to associate recipes with lists
CREATE TABLE list_recipes (
  list_id INT NOT NULL,
  recipe_id INT NOT NULL,
  PRIMARY KEY (list_id, recipe_id),
  FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
);
