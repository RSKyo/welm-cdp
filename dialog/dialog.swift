import Foundation
import AppKit

func writeStderr(_ message: String) {
    let data = Data((message + "\n").utf8)
    FileHandle.standardError.write(data)
}

func exitWithError(_ message: String, code: Int32 = 1) -> Never {
    writeStderr(message)
    exit(code)
}

func printUsageAndExit() -> Never {
    exitWithError("""
usage:
  dialog folder [title]
  dialog file [title]
  dialog files [title]
  dialog save [title]
""")
}

func printPath(_ url: URL) {
    FileHandle.standardOutput.write(Data(url.path.utf8))
}

func printPaths(_ urls: [URL]) {
    let paths = urls.map(\.path)

    do {
        let data = try JSONSerialization.data(withJSONObject: paths)
        FileHandle.standardOutput.write(data)
        FileHandle.standardOutput.write(Data("\n".utf8))
    } catch {
        exitWithError("failed to encode paths as JSON", code: 3)
    }
}

func runOpenPanel(
    canChooseFiles: Bool,
    canChooseDirectories: Bool,
    allowsMultipleSelection: Bool,
    title: String
) {
    let app = NSApplication.shared
    app.setActivationPolicy(.accessory)
    app.activate(ignoringOtherApps: true)

    let panel = NSOpenPanel()
    panel.title = title
    panel.canChooseFiles = canChooseFiles
    panel.canChooseDirectories = canChooseDirectories
    panel.allowsMultipleSelection = allowsMultipleSelection
    panel.canCreateDirectories = false

    panel.begin { response in

        defer {
            NSApp.stop(nil)
        }

        guard response == .OK else {
            exit(2)
        }

        if allowsMultipleSelection {
            printPaths(panel.urls)
        } else if let url = panel.url {
            printPath(url)
        }

        exit(0)
    }

    app.run()
}

func runSavePanel(title: String) {
    let app = NSApplication.shared
    app.setActivationPolicy(.accessory)
    app.activate(ignoringOtherApps: true)

    let panel = NSSavePanel()
    panel.title = title

    panel.begin { response in

        defer {
            NSApp.stop(nil)
        }

        guard response == .OK,
              let url = panel.url else {
            exit(2)
        }

        printPath(url)
        exit(0)
    }

    app.run()
}

let args = Array(CommandLine.arguments.dropFirst())

guard args.count >= 1,
      args.count <= 2 else {
    printUsageAndExit()
}

let command = args[0]
let customTitle = args.count == 2 ? args[1] : nil

switch command {

case "folder":
    runOpenPanel(
        canChooseFiles: false,
        canChooseDirectories: true,
        allowsMultipleSelection: false,
        title: customTitle ?? "Choose Folder"
    )

case "file":
    runOpenPanel(
        canChooseFiles: true,
        canChooseDirectories: false,
        allowsMultipleSelection: false,
        title: customTitle ?? "Choose File"
    )

case "files":
    runOpenPanel(
        canChooseFiles: true,
        canChooseDirectories: false,
        allowsMultipleSelection: true,
        title: customTitle ?? "Choose Files"
    )

case "save":
    runSavePanel(
        title: customTitle ?? "Save File"
    )

default:
    exitWithError("unknown command: \(command)")
}