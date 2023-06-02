declare namespace Dissonance {
  namespace REST {
    /** Discord REST API response. */
    type Response<ResponseType> = {
      response: Response
      data: ResponseType
    }
  }
}
