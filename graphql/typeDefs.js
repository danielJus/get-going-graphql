import { gql } from "apollo-server-express";

const typeDefs = gql`
  directive @unique(
    "The resource path name from the REST endpoint."
    path: String!
    """
    The database key name upon which to force uniqueness.
    If not provided, then the GraphQL schema field name will be used.
    """
    key: String
  ) on INPUT_FIELD_DEFINITION

  """
  An ISO 8601-encoded UTC date string.
  """
  scalar DateTime

  """
  An integer-based rating from 1 (low) to 5 (high).
  """
  scalar Rating

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

  enum SearchOrderBy {
    RESULT_ASC
    RESULT_DESC
  }

  interface Person {
    id: ID!
    name: String!
  }

  union BookResult = Book | Author

  type Author implements Person {
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
    rating: Rating!
    reviewedOn: DateTime!
    reviewer: User!
    text: String
  }
  type User implements Person {
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

  type AuthPayload {
    "The logged-in user."
    viewer: User
    "A JWT issued at the time of the user's most recent authentication."
    token: String
  }

  type Query {
    author(id: ID!): Author
    authors(limit: Int = 20, orderBy: AuthorOrderBy, page: Int): Authors
    book(id: ID!): Book
    books(limit: Int = 20, orderBy: BookOrderBy, page: Int): Books
    review(id: ID!): Review
    searchPeople(exact: Boolean = false, orderBy: SearchOrderBy, query: String!): [Person]
    "Retrieves the currently authenticated user."
    viewer: User
    searchBooks(exact: Boolean = false, orderBy: SearchOrderBy, query: String!): [BookResult]
    user(username: String!): User!
  }

  type Mutation {
    createAuthor(name: String!): Author!
    createBook(input: CreateBookInput!): Book!
    createReview(input: CreateReviewInput!): Review!
    deleteReview(id: ID!): ID!
    updateReview(input: UpdateReviewInput!): Review!
    signUp(input: SignUpInput!): AuthPayload!
    "Authenticates an existing user."
    login(password: String!, username: String!): AuthPayload!
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
    rating: Rating!
    reviewerId: ID!
    text: String
  }

  input UpdateReviewInput {
    id: ID!
    rating: Rating!
    text: String
  }

  input SignUpInput {
    email: String! @unique(path: "users")
    name: String!
    """
    The user's chosen password.
    It must be a minimum of 8 characters in length and contain 1 lowercase
    letter, 1 uppercase letter, 1 number, and 1 special character.
    """
    password: String!
    "The user's chosen username (must be unique)."
    username: String! @unique(path: "users")
  }

  input UpdateLibraryBooksInput {
    bookIds: [ID!]!
    userId: ID!
  }
`;
export default typeDefs;
