import { assert } from "chai";

import { ModelError } from "webiny-model";
import { Entity, QueryResult } from "../../../src/index";
import { User, Company, Image } from "../../entities/userCompanyImage";
import { One } from "../../entities/oneTwoThree";
import sinon from "sinon";
import { MainEntity } from "../../entities/entitiesAttributeEntities";

describe("entity attribute test", function() {
    it("should fail because an invalid instance was set", async () => {
        const user = new User();

        user.firstName = "John";
        user.lastName = "Doe";
        user.company = {
            name: "Company",
            image: new Company()
        };

        let error = null;
        try {
            await user.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(
            error.getData().invalidAttributes.company.data.invalidAttributes.image.type,
            ModelError.INVALID_ATTRIBUTE
        );
    });

    it("should set root and nested values correctly", async () => {
        const user = new User();

        user.firstName = "John";
        user.lastName = "Doe";
        user.company = {
            name: "Company",
            image: {
                filename: "image.jpg",
                size: 123.45
            }
        };

        const company = await user.company;
        const image = await company.image;

        assert.equal(user.firstName, "John");
        assert.equal(user.lastName, "Doe");
        assert.instanceOf(company, Company);
        assert.instanceOf(await company.image, Image);
        assert.equal(company.name, "Company");
        assert.equal(image.filename, "image.jpg");
        assert.equal(image.size, 123.45);

        image.filename = "image222.jpg";
        image.size = 234.56;

        assert.equal(image.filename, "image222.jpg");
        assert.equal(image.size, 234.56);
    });

    it("should populate values correctly", async () => {
        const user = new User();
        user.populate({
            firstName: "John",
            lastName: "Doe",
            company: {
                name: "Company",
                image: {
                    filename: "image.jpg",
                    size: 123.45
                }
            }
        });

        const company = await user.company;
        const image = await company.image;

        assert.equal(user.firstName, "John");
        assert.equal(user.lastName, "Doe");
        assert.instanceOf(company, Company);
        assert.instanceOf(image, Image);
        assert.equal(company.name, "Company");
        assert.equal(image.filename, "image.jpg");
        assert.equal(image.size, 123.45);
    });

    it("should validate root and nested values ", async () => {
        const user = new User();
        user.populate({
            firstName: "John",
            lastName: "Doe",
            company: {
                image: {
                    size: 123.45
                }
            }
        });

        let error = null;
        try {
            await user.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(error.getType(), ModelError.INVALID_ATTRIBUTES);
        let invalid = error.getData().invalidAttributes.company.data.invalidAttributes;

        assert.hasAllKeys(invalid, ["name", "image"]);
        assert.equal(invalid.name.data.validator, "required");

        assert.hasAllKeys(invalid.image.data.invalidAttributes, ["filename"]);
        assert.equal(invalid.image.data.invalidAttributes.filename.data.validator, "required");

        user.populate({
            company: {
                image: {
                    filename: "image.jpg"
                }
            }
        });

        error = null;
        try {
            await user.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(error.getType(), ModelError.INVALID_ATTRIBUTES);
        invalid = error.getData().invalidAttributes.company.data.invalidAttributes;

        assert.hasAllKeys(invalid, ["name"]);
        assert.equal(invalid.name.data.validator, "required");

        user.populate({
            company: {
                name: "Company"
            }
        });

        error = null;
        try {
            await user.validate();
        } catch (e) {
            error = e;
        }

        assert.isNull(error);
    });

    it("should set entity only once using setter and populate methods", async () => {
        class Primary extends Entity {
            constructor() {
                super();
                this.attr("name")
                    .char()
                    .setValidators("required");
                this.attr("secondary")
                    .entity(Secondary)
                    .setOnce();
            }
        }

        class Secondary extends Entity {
            constructor() {
                super();
                this.attr("name")
                    .char()
                    .setValidators("required");
            }
        }

        const secondary1 = new Secondary();
        secondary1.name = "secondary1";

        const primary = new Primary();
        primary.name = "primary";
        primary.secondary = secondary1;

        assert.equal(primary.name, "primary");

        let secondary = await primary.secondary;
        assert.equal(secondary.name, "secondary1");

        const secondary2 = new Secondary();
        secondary2.name = "secondary2";

        primary.secondary = secondary2;

        secondary = await primary.secondary;
        assert.equal(primary.name, "primary");
        assert.equal(secondary.name, "secondary1");
    });

    it("should set entity only once using setter and populate methods", async () => {
        class Primary extends Entity {
            constructor() {
                super();
                this.attr("name")
                    .char()
                    .setValidators("required");
                this.attr("secondary")
                    .entity(Secondary)
                    .setOnce();
            }
        }

        class Secondary extends Entity {
            constructor() {
                super();
                this.attr("name")
                    .char()
                    .setValidators("required");
            }
        }

        const secondary1 = new Secondary();
        secondary1.name = "secondary1";

        const primary = new Primary();
        primary.name = "primary";
        primary.secondary = secondary1;

        let secondary = await primary.secondary;

        assert.equal(primary.name, "primary");
        assert.equal(secondary.name, "secondary1");

        const secondary2 = new Secondary();
        secondary2.name = "secondary2";

        primary.secondary = secondary2;

        secondary = await primary.secondary;
        assert.equal(primary.name, "primary");
        assert.equal(secondary.name, "secondary1");
    });

    it("must set entity to null", async () => {
        const entity = new User();
        entity.company = { name: "Test-1" };

        assert.instanceOf(await entity.company, Company);

        entity.company = null;
        assert.isNull(await entity.company);
    });

    it("should return null because no data was assigned", async () => {
        const entity = new User();
        assert.isNull(await entity.company);
    });

    it("should lazy load any of the accessed linked entities", async () => {
        let findById = sinon
            .stub(One.getDriver(), "findById")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "two", name: "Two", three: "three" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({
                    id: "three",
                    name: "Three",
                    four: "four",
                    anotherFour: "anotherFour",
                    five: "five",
                    six: "six"
                });
            })
            .onCall(3)
            .callsFake(() => {
                return new QueryResult({ id: "four", name: "Four" });
            })
            .onCall(4)
            .callsFake(() => {
                return new QueryResult({ id: "anotherFour", name: "Another Four" });
            })
            .onCall(5)
            .callsFake(() => {
                return new QueryResult({ id: "five", name: "Five" });
            })
            .onCall(6)
            .callsFake(() => {
                return new QueryResult({ id: "six", name: "Six" });
            });

        const one = await One.findById("one");
        assert.equal(one.id, "one");
        assert.equal(one.name, "One");
        assert.equal(one.getAttribute("two").value.getCurrent(), "two");

        const two = await one.two;
        assert.equal(two.id, "two");
        assert.equal(two.name, "Two");

        assert.equal(two.getAttribute("three").value.getCurrent(), "three");

        const three = await two.three;
        assert.equal(three.id, "three");
        assert.equal(three.name, "Three");

        assert.equal(three.getAttribute("four").value.getCurrent(), "four");

        const four = await three.four;
        assert.equal(four.id, "four");
        assert.equal(four.name, "Four");

        const anotherFour = await three.anotherFour;
        assert.equal(anotherFour.id, "anotherFour");
        assert.equal(anotherFour.name, "Another Four");

        const five = await three.five;
        assert.equal(five.id, "five");
        assert.equal(five.name, "Five");

        const six = await three.six;
        assert.equal(six.id, "six");
        assert.equal(six.name, "Six");

        findById.restore();
    });

    it("should set internal loaded flag to true when called for the first time, and no findById calls should be made", async () => {
        let findById = sinon
            .stub(One.getDriver(), "findById")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One" });
            });

        const one = await One.findById("one");
        findById.restore();

        assert.equal(one.getAttribute("two").value.getCurrent(), null);
        assert.deepEqual(one.getAttribute("two").value.status, { loaded: false, loading: false });

        findById = sinon.spy(One.getDriver(), "findById");
        one.two;
        one.two;
        await one.two;
        await one.two;

        assert.equal(findById.callCount, 0);
        assert.equal(one.getAttribute("two").value.getCurrent(), null);
        assert.deepEqual(one.getAttribute("two").value.status, { loaded: true, loading: false });

        await one.two;

        assert.equal(findById.callCount, 0);
        assert.equal(one.getAttribute("two").value.getCurrent(), null);
        assert.deepEqual(one.getAttribute("two").value.status, { loaded: true, loading: false });

        findById.restore();
    });

    it("should throw an exception", async () => {
        const mainEntity = new One();

        const entityPopulate = sinon
            .stub(mainEntity.getAttribute("two").value, "setCurrent")
            .callsFake(() => {
                throw Error("Error was thrown.");
            });

        let error = null;
        try {
            await mainEntity.set("two", []);
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, Error);
        entityPopulate.restore();
    });
});