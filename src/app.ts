/// <reference path="models/drag-drop.ts" />
/// <reference path="models/project.ts" />
/// <reference path="state/project-state.ts" />
/// <reference path="utility/validtion.ts" />
/// <reference path="utility/autobinder.ts" />
/// <reference path="components/base-component.ts" />

// import { Component } from "./components/base-component.js";
// import { DragTarget, Draggable } from "./models/drag-drop.js";
// import { Project, ProjectStatus } from "./models/project.js";
// import { AutoBind } from "./utility/autobinder.js";
// import { validate, Validatable } from "./utility/validtion.js";
// import { projectState } from "./state/project-state.js";

namespace App {
    class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
        private project: Project;

        constructor(hostId: string, project: Project) {
            super("single-project", hostId, false, project.id);
            this.project = project;
            this.configure();
            this.renderContent();
        }

        @AutoBind
        dragStartHandler(event: DragEvent): void {
            event.dataTransfer!.setData("text/plain", this.project.id);
            event.dataTransfer!.effectAllowed = "move";
        }

        @AutoBind
        dragEndHandler(_: DragEvent): void {
            console.log("Drag End");
        }

        configure(): void {
            this.element.addEventListener("dragstart", this.dragStartHandler);
            this.element.addEventListener("dragend", this.dragEndHandler);
        }

        renderContent(): void {
            this.element.querySelector("h2")!.textContent = this.project.title
            this.element.querySelector("h3")!.textContent = this.project.people.toString()
            this.element.querySelector("p")!.textContent = this.project.description
        }
    }

    class ProjectList extends Component<HTMLDivElement, HTMLUListElement> implements DragTarget {
        assignedProject: Project[];

        constructor(private type: "active" | "finished") {
            super("project-list", "app", false, `${type}-projects`)
            this.assignedProject = [];

            projectState.addListener((projects: Project[]) => {
                const relatedProject = projects.filter(prj => {
                    if (this.type === "active") {
                        return prj.status === ProjectStatus.Active;
                    }
                    return prj.status === ProjectStatus.Finished;
                })
                this.assignedProject = relatedProject;
                this.renderProjects();
            });
            this.configure();
            this.renderContent();
        }

        @AutoBind
        dragOverHandler(event: DragEvent): void {
            event.preventDefault();
            const listEl = this.element.querySelector("ul")!;
            listEl.classList.add("droppable");
        }

        @AutoBind
        dragLeaveHandler(_: DragEvent): void {
            const listEl = this.element.querySelector("ul")!;
            listEl.classList.remove("droppable");
        }

        @AutoBind
        dropHandler(event: DragEvent): void {
            const prjId = event.dataTransfer!.getData("text/plain");
            projectState.moveProject(
                prjId,
                this.type === "active" ? ProjectStatus.Active : ProjectStatus.Finished
            );
        }

        configure(): void {
            this.element.addEventListener("dragover", this.dragOverHandler);
            this.element.addEventListener("dragleave", this.dragLeaveHandler);
            this.element.addEventListener("drop", this.dropHandler);
        }

        renderContent() {
            const listId = `${this.type}-project-list`;
            this.element.querySelector("ul")!.id = listId
            this.element.querySelector("h2")!.textContent = `${this.type.toUpperCase()} PROJECTS`
        }

        private renderProjects() {
            const listElement = document.getElementById(`${this.type}-project-list`) as HTMLUListElement;
            listElement.innerHTML = "";
            for (const prjItem of this.assignedProject) {
                new ProjectItem(this.element.querySelector("ul")!.id, prjItem);
            }
        }
    }

    class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
        titleInputElement: HTMLInputElement;
        descriptionInputElement: HTMLTextAreaElement;
        peopleInputElement: HTMLInputElement;

        constructor() {
            super("project-input", "app", true, "user-input")
            this.titleInputElement = this.element.querySelector("#title") as HTMLInputElement;
            this.descriptionInputElement = this.element.querySelector("#description") as HTMLTextAreaElement;
            this.peopleInputElement = this.element.querySelector("#people") as HTMLInputElement;

            this.configure();
        }

        configure() {
            this.element.addEventListener("submit", this.submitHandler)
        }

        renderContent(): void { }

        private getUserInput(): [string, string, number] | void {
            const enteredTitle = this.titleInputElement.value;
            const enteredDescription = this.descriptionInputElement.value;
            const enteredPeople = this.peopleInputElement.value;
            const titleValidateble: Validatable = {
                value: enteredTitle,
                required: true,
                minLength: 3
            };
            const descriptionValidateble: Validatable = {
                value: enteredDescription,
                required: true,
                minLength: 5,
                maxLength: 120
            };
            const peopleValidateble: Validatable = {
                value: +enteredPeople,
                required: true,
                min: 1,
                max: 10
            };

            if (!validate(titleValidateble) || !validate(descriptionValidateble) || !validate(peopleValidateble)) {
                alert("Invalid Input Pleace Try Again !");
                return;
            } else {
                return [enteredTitle, enteredDescription, +enteredPeople];
            }
        }

        private clearInputs() {
            this.titleInputElement.value = "";
            this.descriptionInputElement.value = "";
            this.peopleInputElement.value = "";
        }

        @AutoBind
        private submitHandler(event: Event) {
            event.preventDefault();
            const userInput = this.getUserInput();
            if (Array.isArray(userInput)) {
                const [title, desc, people] = userInput;
                projectState.addProject(title, desc, people);
                this.clearInputs();
            }
        }
    }

    new ProjectInput();
    new ProjectList("active");
    new ProjectList("finished");
}