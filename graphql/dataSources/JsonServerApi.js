import { ForbiddenError, UserInputError } from "apollo-server"
import { RESTDataSource } from "apollo-datasource-rest"
import parseLinkHeader from "parse-link-header"

class JsonServerApi extends RESTDataSource {
  baseURL = process.env.REST_API_BASE_URL

  async didReceiveResponse(response) {
    if (response.ok) {
      this.linkHeader = response.headers.get("Link")
      this.totalCountHeader = response.headers.get("X-Total-Count")
      return this.parseBody(response)
    } else {
      throw await this.errorFromResponse(response)
    }
  }

  parseParams({ limit, orderBy, page, ...rest }) {
    if (limit && limit > 100) {
      throw new UserInputError("Maximum of 100 results per page")
    }

    const paginationParams = []
    paginationParams.push(`_limit=${limit}`, `_page=${page || "1"}`)
    // Parse the `orderBy` argument into a `_sort` argument
    // Handle other parameters collected in `rest`
    // Return the full-assembled query string

    const [sort, order] = orderBy ? orderBy.split("_") : []
    // Handle other parameters collected in `rest`
    // Return the full-assembled query string

    const otherParams = Object.keys(rest).map((key) => `${key}=${rest[key]}`)
    const queryString = [
      ...(sort ? [`_sort=${sort}`] : []),
      ...(order ? [`_order=${order}`] : []),
      ...paginationParams,
      ...otherParams,
    ].join("&")
    return queryString ? `?${queryString}` : ""
  }

  parsePageInfo({ limit, page }) {
    if (this.totalCountHeader) {
      let hasNextPage, hasPrevPage
      if (this.linkHeader) {
        const { next, prev } = parseLinkHeader(this.linkHeader)
        hasNextPage = !!next
        hasPrevPage = !!prev
      }
      return {
        hasNextPage: hasNextPage || false,
        hasPrevPage: hasPrevPage || false,
        page: page || 1,
        perPage: limit,
        totalCount: this.totalCountHeader,
      }
    }
    return null
  }

  getAuthorById(id) {
    return this.get(`/authors/${id}`).catch(
      (err) => err.message === "404: Not Found" && null
    )
  }

  async getAuthorBooks(authorId) {
    const items = await this.get(`/authors/${authorId}/books`)
    return items.map((item) => item.book)
  }

  async getAuthors({ limit, page, orderBy = "name_asc" }) {
    const queryString = this.parseParams({
      ...(limit && { limit }),
      ...(page && { page }),
      orderBy,
    })
    const authors = await this.get(`/authors${queryString}`)
    const pageInfo = this.parsePageInfo({ limit, page })
    return { results: authors, pageInfo }
  }

  getBookById(id) {
    return this.get(`/books/${id}`).catch(
      (err) => err.message === "404: Not Found" && null
    )
  }

  async getBookAuthors(bookId) {
    const items = await this.get(`/books/${bookId}/authors`)
    return items.map((item) => item.author)
  }

  async getBooks({ limit, page, orderBy = "title_asc" }) {
    const queryString = this.parseParams({
      ...(limit && { limit }),
      ...(page && { page }),
      orderBy,
    })
    const books = await this.get(`/books${queryString}`)
    const pageInfo = this.parsePageInfo({ limit, page })
    return { results: books, pageInfo }
  }

  async getBookReviews(bookId, { limit, page, orderBy = "createdAt_desc" }) {
    const queryString = this.parseParams({
      ...(limit && { limit }),
      ...(page && { page }),
      bookId,
      orderBy,
    })
    const reviews = await this.get(`/reviews${queryString}`)
    const pageInfo = this.parsePageInfo({ limit, page })
    return { results: reviews, pageInfo }
  }

  getReviewById(id) {
    return this.get(`/reviews/${id}`).catch(
      (err) => err.message === "404: Not Found" && null
    )
  }

  getUserById(id) {
    return this.get(`/users/${id}`).catch(
      (err) => err.message === "404: Not Found" && null
    )
  }

  async getUserLibrary(userId, { limit, page, orderBy = "createdAt_desc" }) {
    const queryString = this.parseParams({
      _expand: "book",
      ...(limit && { limit }),
      ...(page && { page }),
      orderBy,
      userId,
    })
    const items = await this.get(`/userBooks${queryString}`)
    const books = items.map((item) => item.book)
    const pageInfo = this.parsePageInfo({ limit, page })
    return { results: books, pageInfo }
  }

  async getUserReviews(userId, { limit, page, orderBy = "createdAt_desc" }) {
    const queryString = this.parseParams({
      ...(limit && { limit }),
      ...(page && { page }),
      orderBy,
      userId,
    })
    const reviews = await this.get(`/reviews${queryString}`)
    const pageInfo = this.parsePageInfo({ limit, page })
    return { results: reviews, pageInfo }
  }

  async getUser(username) {
    const [user] = await this.get(`/users?username=${username}`)
    return user
  }

  createAuthor(name) {
    return this.post("/authors", { name })
  }

  async createBook({ authorIds, cover, genre, summary, title }) {
    const book = await this.post("/books", {
      ...(cover && { cover }),
      ...(genre && { genre }),
      ...(summary && { summary }),
      title,
    })

    return book
  }

  async createReview({ bookId, rating, reviewerId, text }) {
    const existingReview = await this.get(
      `/reviews?bookId=${bookId}&userId=${reviewerId}`
    )
    if (existingReview.length) {
      throw new ForbiddenError("Users can only submit one review perbook")
    }
    return this.post("/reviews", {
      ...(text && { text }),
      bookId: parseInt(bookId),
      createdAt: new Date().toISOString(),
      rating,
      userId: parseInt(reviewerId),
    })
  }

  updateReview({ id, rating, text }) {
    return this.patch(`reviews/${id}`, {
      rating,
      ...(text && { text }),
    })
  }
  async deleteReview(id) {
    await this.delete(`/reviews/${id}`)
    return id
  }

  async checkUniqueUserData(email, username) {
    const res = await Promise.all([
      this.get(`/users?email=${email}`),
      this.get(`/users?username=${username}`),
    ])
    const [existingEmail, existingUsername] = res
    if (existingEmail.length) {
      throw new UserInputError("Email is already in use")
    } else if (existingUsername.length) {
      throw new UserInputError("Username already in use")
    }
  }

  async signUp({ email, name, username }) {
    await this.checkUniqueUserData(email, username)
    return this.post("/users", {
      email,
      name,
      username,
    })
  }

  async addBooksToLibrary({ bookIds, userId }) {
    const response = await Promise.all(
      bookIds.map((bookId) =>
        this.get(`/userBooks/?userId=${userId}&bookId=${bookId}`)
      )
    )
    const existingUserBooks = response.flat()
    const newBookIds = bookIds.filter(
      (bookId) =>
        !existingUserBooks.find((book) => book.id === parseInt(bookId))
    )
    await Promise.all(
      bookIds.map((bookId) =>
        this.post("/userBooks", {
          bookId: parseInt(bookId),
          createdAt: new Date().toISOString(),
          userId: parseInt(userId),
        })
      )
    )
    return this.get(`/users/${userId}`)
  }

  async removeBooksFromLibrary({ bookIds, userId }) {
    const response = await Promise.all(
      bookIds.map((bookId) =>
        this.get(`/userBooks/?userId=${userId}&bookId=${bookId}`)
      )
    )
    const existingUserBooks = response.flat()
    await Promise.all(
      existingUserBooks.map(({ id }) => this.delete(`/userBooks/${id}`))
    )
    return this.get(`/users/${userId}`)
  }
}

export default JsonServerApi
