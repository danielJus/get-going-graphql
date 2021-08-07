import { gql } from "apollo-server"
const typeDefs = gql`
  enum Genre {
    ADVENTURE
    CHILDREN
    CLASSICS
    COMIC_GRAPHIC_NOVEL
    DETECTIVE_MYSTERY
    DYSTOPIA
    FANTASY
    HORROR
    HUMOR
    NON_FICTION
    SCIENCE_FICTION
    ROMANCE
    THRILLER
    WESTERN
  }

  enum AuthorOrderBy {
    NAME_ASC
    NAME_DESC
  }

  enum BookOrderBy {
    TITLE_ASC
    TITLE_DESC
  }

  enum LibraryOrderBy {
    ADDED_ON_ASC
    ADDED_ON_DESC
  }

  enum ReviewOrderBy {
    REVIEWED_ON_ASC
    REVIEWED_ON_DESC
  }

  type Author {
    id: ID!
    books: [Book]
    name: String!
  }

  type Book {
    id: ID!
    authors: [Author]
    cover: String
    genre: Genre
    reviews(limit: Int = 20, orderBy: ReviewOrderBy, page: Int): Reviews
    summary: String
    title: String!
  }

  type Review {
    id: ID!
    book: Book
    rating: Int!
    reviewedOn: String!
    reviewer: User!
    text: String
  }
  type User {
    id: ID!
    email: String!
    library(limit: Int = 20, orderBy: LibraryOrderBy, page: Int): Books
    name: String!
    reviews(limit: Int = 20, orderBy: ReviewOrderBy, page: Int): Reviews
    username: String!
  }

  type PageInfo {
    hasNextPage: Boolean
    hasPrevPage: Boolean
    page: Int
    perPage: Int
    totalCount: Int
  }

  type Authors {
    results: [Author]
    pageInfo: PageInfo
  }

  type Books {
    results: [Book]
    pageInfo: PageInfo
  }

  type Reviews {
    results: [Review]
    pageInfo: PageInfo
  }

  type Query {
    author(id: ID!): Author
    authors(limit: Int = 20, orderBy: AuthorOrderBy, page: Int): Authors
    book(id: ID!): Book
    books(limit: Int = 20, orderBy: BookOrderBy, page: Int): Books
    review(id: ID!): Review
    user(username: String!): User!
  }

  type Mutation {
    createAuthor(name: String!): Author!
    createBook(input: CreateBookInput!): Book!
    createReview(input: CreateReviewInput!): Review!
    deleteReview(id: ID!): ID!
    updateReview(input: UpdateReviewInput!): Review!
    signUp(input: SignUpInput!): User!
    addBooksToLibrary(input: UpdateLibraryBooksInput!): User!
    removeBooksFromLibrary(input: UpdateLibraryBooksInput!): User!
  }

  input CreateBookInput {
    authorIds: [ID]
    cover: String
    genre: Genre
    title: String!
  }

  input CreateReviewInput {
    bookId: ID!
    rating: Int!
    reviewerId: ID!
    text: String
  }

  input UpdateReviewInput {
    id: ID!
    rating: Int!
    text: String
  }

  input SignUpInput {
    email: String!
    name: String!
    username: String!
  }

  input UpdateLibraryBooksInput {
    bookIds: [ID!]!
    userId: ID!
  }
`
export default typeDefs
