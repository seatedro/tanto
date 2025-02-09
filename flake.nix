{
  description = "LLM Benchmark Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      system = "aarch64-darwin";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          bun
          uv
          rustc
          cargo
          python3
          zig
          clang
          git
          hyperfine
        ];
        RUST_SRC = pkgs.rustc.src;
        shellHook = ''
          export PATH="$PATH:$HOME/.cargo/bin"
          export PATH="$PATH:$HOME/zig"
          bun install
        '';
      };
    };
}
