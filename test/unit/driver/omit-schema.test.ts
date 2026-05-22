import { expect } from "chai"
import { CockroachDriver } from "../../../src/driver/cockroachdb/CockroachDriver"
import { OracleDriver } from "../../../src/driver/oracle/OracleDriver"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { SapDriver } from "../../../src/driver/sap/SapDriver"
import { SqlServerDriver } from "../../../src/driver/sqlserver/SqlServerDriver"

type DriverWithSchema = {
    options: { omitSchema?: boolean }
    database?: string
    schema?: string
    buildTableName: (...args: unknown[]) => string
    parseTableName: (target: string) => {
        database?: string
        schema?: string
        tableName: string
    }
}

describe("driver > omitSchema", () => {
    function createDriverInstance<T extends object>(driverClass: {
        prototype: T
    }): T {
        return Object.create(driverClass.prototype) as T
    }

    function setupDriver(driver: DriverWithSchema, omitSchema: boolean): void {
        driver.options = { omitSchema }
        driver.database = "test_db"
        driver.schema = "public"
    }

    describe("postgres-like drivers", () => {
        const postgresLikeDrivers: [string, DriverWithSchema][] = [
            ["PostgresDriver", createDriverInstance(PostgresDriver)],
            ["CockroachDriver", createDriverInstance(CockroachDriver)],
            ["SapDriver", createDriverInstance(SapDriver)],
        ]

        for (const [name, driver] of postgresLikeDrivers) {
            describe(name, () => {
                it("should omit schema in buildTableName when omitSchema is enabled", () => {
                    setupDriver(driver, true)
                    expect(driver.buildTableName("user", "public")).to.equal(
                        "user",
                    )
                })

                it("should include schema in buildTableName when omitSchema is disabled", () => {
                    setupDriver(driver, false)
                    expect(driver.buildTableName("user", "public")).to.equal(
                        "public.user",
                    )
                })

                it("should omit schema in parseTableName when omitSchema is enabled", () => {
                    setupDriver(driver, true)
                    expect(driver.parseTableName("public.user")).to.deep.equal({
                        database: "test_db",
                        schema: undefined,
                        tableName: "user",
                    })
                })

                it("should keep schema in parseTableName when omitSchema is disabled", () => {
                    setupDriver(driver, false)
                    expect(driver.parseTableName("user")).to.deep.equal({
                        database: "test_db",
                        schema: "public",
                        tableName: "user",
                    })
                })

                it("should preserve explicit schema in parseTableName when omitSchema is disabled", () => {
                    setupDriver(driver, false)
                    expect(
                        driver.parseTableName("custom_schema.user"),
                    ).to.deep.equal({
                        database: "test_db",
                        schema: "custom_schema",
                        tableName: "user",
                    })
                })
            })
        }
    })

    describe("sqlserver driver", () => {
        const driver = createDriverInstance(
            SqlServerDriver,
        ) as unknown as DriverWithSchema

        it("should omit schema in buildTableName when omitSchema is enabled", () => {
            setupDriver(driver, true)
            expect(driver.buildTableName("user", "dbo", "test_db")).to.equal(
                "test_db..user",
            )
        })

        it("should include schema in buildTableName when omitSchema is disabled", () => {
            setupDriver(driver, false)
            expect(driver.buildTableName("user", "dbo", "test_db")).to.equal(
                "test_db.dbo.user",
            )
        })

        it("should omit schema in parseTableName when omitSchema is enabled", () => {
            setupDriver(driver, true)
            expect(driver.parseTableName("test_db.dbo.user")).to.deep.equal({
                database: "test_db",
                schema: undefined,
                tableName: "user",
            })
        })

        it("should preserve schema in parseTableName when omitSchema is disabled", () => {
            setupDriver(driver, false)
            expect(driver.parseTableName("test_db.dbo.user")).to.deep.equal({
                database: "test_db",
                schema: "dbo",
                tableName: "user",
            })
        })
    })

    describe("oracle driver", () => {
        const driver = createDriverInstance(
            OracleDriver,
        ) as unknown as DriverWithSchema

        it("should omit schema in buildTableName when omitSchema is enabled", () => {
            setupDriver(driver, true)
            expect(driver.buildTableName("user", "public")).to.equal("user")
        })

        it("should include schema in buildTableName when omitSchema is disabled", () => {
            setupDriver(driver, false)
            expect(driver.buildTableName("user", "public")).to.equal(
                "public.user",
            )
        })

        it("should omit schema in parseTableName when omitSchema is enabled", () => {
            setupDriver(driver, true)
            expect(driver.parseTableName("public.user")).to.deep.equal({
                database: "test_db",
                schema: undefined,
                tableName: "user",
            })
        })

        it("should preserve schema in parseTableName when omitSchema is disabled", () => {
            setupDriver(driver, false)
            expect(driver.parseTableName("public.user")).to.deep.equal({
                database: "test_db",
                schema: "public",
                tableName: "user",
            })
        })
    })
})
