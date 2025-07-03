import { prisma } from "@/lib/prisma"

async function checkOperatorWilayah() {
  try {
    console.log("Checking operator data...")
    
    // Check all operators
    const operators = await prisma.user.findMany({
      where: { role: "OPERATOR" },
      select: { 
        id: true,
        name: true,
        email: true,
        wilayah: true,
        role: true
      }
    })
    
    console.log("Operators found:", operators)
    
    // Check if any operators have wilayah
    const operatorsWithWilayah = operators.filter(op => op.wilayah)
    console.log("Operators with wilayah:", operatorsWithWilayah)
    
    // Check total users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    })
    
    console.log("Users by role:", usersByRole)
    
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOperatorWilayah()
