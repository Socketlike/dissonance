declare namespace Dissonance {
  namespace REST {
    /** Discord REST API response. */
    interface Response<ResponseType> {
      response: Response
      data: ResponseType
    }
  }
}
