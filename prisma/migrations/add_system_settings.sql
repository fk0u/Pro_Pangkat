// Add the SystemSetting model to the existing schema
model SystemSetting {
  category    String
  key         String
  value       String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@id([category, key])
  @@index([category])
}
