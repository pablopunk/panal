// Authentication utilities

interface User {
  username: string
  password: string // In a real app, this would be hashed
}

// Mock user database
const users: User[] = []

export function isSetupComplete(): boolean {
  return users.length > 0
}

export function createUser(username: string, password: string): boolean {
  // Check if username already exists
  if (users.some((user) => user.username === username)) {
    return false
  }

  // In a real app, you would hash the password here
  users.push({ username, password })
  return true
}

export function validateUser(username: string, password: string): boolean {
  // In a real app, you would compare with hashed password
  return users.some((user) => user.username === username && user.password === password)
}

export function updateUserPassword(username: string, currentPassword: string, newPassword: string): boolean {
  const userIndex = users.findIndex((user) => user.username === username && user.password === currentPassword)

  if (userIndex === -1) {
    return false
  }

  // In a real app, you would hash the new password
  users[userIndex].password = newPassword
  return true
}
