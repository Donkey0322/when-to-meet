class NormalException(Exception):
    pass


class NotFound(NormalException):
    """
    Not found
    """


class UniqueViolationError(NormalException):
    """
    Unique Violation Error
    """


class LoginExpired(NormalException):
    """
    Login token expired
    """


class LoginFailed(NormalException):
    """
    Login failed
    """


class NoPermission(NormalException):
    """
    No access to resource
    """


class UsernameExists(NormalException):
    """
    duplicate username
    """


class IllegalInput(NormalException):
    """
    Input is not legal
    """


class IllegalCharacter(NormalException):
    """
    Input contains illegal character
    """


class EmailExist(NormalException):
    """
    Email is duplicate
    """


class EmailRegisteredByGoogle(NormalException):
    """
    User has already used the email for Google login
    """


class LineAccountNotConnected(NormalException):
    """
    User hasn't connect line account to let's meet account
    """
