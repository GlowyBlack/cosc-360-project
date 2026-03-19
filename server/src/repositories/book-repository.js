import Book from "../models/book.js";
import mongoose from "mongoose";

const BookRepository = {
    async createBook(data) {
        return await Book.create(data); 
    },

    async findBook(){

    },

    async findAll(){

    }
};

// const findAll = async () => {
//     return [
//         {
//             title: "The Great Gatsby",
//             author: "F. Scott Fitzgerald",
//             owner: "Jovan Kalirai",
//             status: "Available",
//         },
//         {
//             title: "1984",
//             author: "George Orwell",
//             owner: "Armaan Cheema",
//             status: "Borrowed",

//         },
//     ];
// };

export default {BookRepository };
